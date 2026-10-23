import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma, TransactionDirection } from 'generated/prisma/client';
import { PaymentAllocationUncheckedCreateWithoutPaymentInput } from 'generated/prisma/models';
import { DateTime } from 'luxon';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentsBodyDto } from './dto/create-payment.dto';
import { ReversePaymentBodyDto } from './dto/reverse-payment.dto';

interface PaymentStrategy {
  ids: string[];
  foreignKey: 'receivableId';
  customerId?: string;
  transactionCategory: string;
  transactionFlow: TransactionDirection;
  find: (tx: Prisma.TransactionClient) => Promise<{ id: string; total: number; paid: number }[]>;
  recalc: (tx: Prisma.TransactionClient, id: string) => Promise<unknown>;
  notFoundMessage: (id: string) => string;
}

interface ReversalStrategy {
  foreignKey: 'receivableId';
  recalc: (tx: Prisma.TransactionClient) => Promise<unknown>;
}

@Injectable()
export class PaymentService {
  constructor(private readonly prismaService: PrismaService) {}

  async chargeReceivables(data: CreatePaymentsBodyDto) {
    const { customerId, receivables, value, method } = data;

    return this.executePayment(this.receivableStrategy(customerId, receivables), value, method);
  }

  private receivableStrategy(customerId: string, ids: string[]): PaymentStrategy {
    return {
      ids,
      foreignKey: 'receivableId',
      customerId,
      transactionCategory: 'SALES_REVENUE',
      transactionFlow: 'INFLOW',
      find: (tx) => this.findReceivables(tx, ids, customerId),
      recalc: (tx, id) => this.recalcReceivableBalance(tx, id),
      notFoundMessage: (id) => `O recebível ${id} não foi encontrado, não pertence a este cliente ou já está quitado`,
    };
  }

  private async executePayment(strategy: PaymentStrategy, value: number, method?: PaymentMethod) {
    return this.prismaService.$transaction(async (tx) => {
      const records = await strategy.find(tx);

      const foundIds = new Set(records.map((r) => r.id));
      const missingId = strategy.ids.find((id) => !foundIds.has(id));
      if (missingId) throw new BadRequestException(strategy.notFoundMessage(missingId));

      const totalDebt = records.reduce((acc, r) => acc + (r.total - r.paid), 0);
      if (value > totalDebt) {
        throw new BadRequestException(
          `O valor informado (${value}) excede o total em aberto dos registros selecionados (${totalDebt})`,
        );
      }

      const now = DateTime.now().setZone('America/Sao_Paulo').toJSDate();
      const allocationsToCreate: PaymentAllocationUncheckedCreateWithoutPaymentInput[] = [];
      const touchedIds: string[] = [];
      let balance = value;

      for (const r of records) {
        if (balance <= 0) break;
        const debt = r.total - r.paid;
        const applied = Math.min(debt, balance);

        allocationsToCreate.push({ amount: applied, [strategy.foreignKey]: r.id });
        touchedIds.push(r.id);
        balance -= applied;
      }

      const payment = await tx.payment.create({
        data: {
          type: 'CHARGE',
          method,
          paidAt: now,
          total: value,
          allocations: { createMany: { data: allocationsToCreate } },
          transaction: {
            create: {
              ocurredAt: now,
              origin: 'PAYMENT',
              category: strategy.transactionCategory,
              description: `Pagamento realizado - ${records.length} contas`,
              flow: strategy.transactionFlow,
              value,
            },
          },
        },
      });

      for (const id of touchedIds) {
        await strategy.recalc(tx, id);
      }

      return payment;
    });
  }

  private async findReceivables(tx: Prisma.TransactionClient, ids: string[], customerId: string) {
    return tx.receivable.findMany({
      where: { id: { in: ids }, customerId, status: { not: 'PAID' } },
      select: { id: true, total: true, paid: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async recalcReceivableBalance(tx: Prisma.TransactionClient, receivableId: string) {
    const { _sum } = await tx.paymentAllocation.aggregate({
      where: { receivableId },
      _sum: { amount: true },
    });
    const paid = _sum.amount ?? 0;

    const receivable = await tx.receivable.findUniqueOrThrow({
      where: { id: receivableId },
      select: { total: true },
    });
    const status = paid <= 0 ? 'PENDING' : paid >= receivable.total ? 'PAID' : 'PARTIAL';
    const now = DateTime.now().setZone('America/Sao_Paulo').toJSDate();

    return tx.receivable.update({
      where: { id: receivableId },
      data: { paid, status, paidAt: status === 'PAID' ? now : null },
    });
  }

  async reverseReceivable(recordId: string, data: ReversePaymentBodyDto) {
    return this.executeReversal(
      { foreignKey: 'receivableId', recalc: (tx) => this.recalcReceivableBalance(tx, recordId) },
      recordId,
      data,
    );
  }

  private async executeReversal(strategy: ReversalStrategy, recordId: string, data: ReversePaymentBodyDto) {
    if (!data.allocations?.length) {
      throw new BadRequestException('Informe ao menos uma alocação para estornar');
    }

    const date = DateTime.fromISO(data.date, { zone: 'America/Sao_Paulo' }).toJSDate();

    return this.prismaService.$transaction(async (tx) => {
      const allocations = await tx.paymentAllocation.findMany({
        where: { [strategy.foreignKey]: recordId, id: { in: data.allocations } },
        select: {
          id: true,
          paymentId: true,
          amount: true,
          reversalOfId: true,
          payment: { select: { method: true, transaction: { select: { id: true } } } },
        },
      });

      if (allocations.length !== data.allocations.length) {
        throw new BadRequestException('Uma ou mais alocações informadas são inválidas para esta conta');
      }

      const invalidAllocation = allocations.find((a) => a.reversalOfId !== null);
      if (invalidAllocation) {
        throw new BadRequestException(`Alocação ${invalidAllocation.id} já foi estornada ou ela própria é um estorno`);
      }

      const groupedByPayment = allocations.reduce(
        (acc, a) => {
          (acc[a.paymentId] ??= []).push(a);
          return acc;
        },
        {} as Record<string, typeof allocations>,
      );

      for (const group of Object.values(groupedByPayment)) {
        const groupTotal = group.reduce((acc, a) => acc + a.amount, 0);

        await tx.payment.create({
          data: {
            total: groupTotal,
            paidAt: date,
            type: data.reason,
            method: group[0].payment.method,
            allocations: {
              createMany: {
                data: group.map((a) => ({
                  [strategy.foreignKey]: recordId,
                  amount: -a.amount,
                  reversalOfId: a.id,
                })),
              },
            },
            transaction: {
              create: {
                category: 'REVERSAL',
                description: data.reason === 'REVERSAL_CORRECTION' ? 'Correção de alocação' : 'Estorno/Reembolso',
                flow: 'OUTFLOW',
                ocurredAt: date,
                origin: 'PAYMENT',
                value: groupTotal,
                reversalOfId: group[0].payment.transaction?.id,
              },
            },
          },
        });
      }

      await strategy.recalc(tx);
    });
  }
}

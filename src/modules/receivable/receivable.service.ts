import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { buildPrismaFilter } from 'src/common/utils/filter.util';
import { buildPrismaPagination } from 'src/common/utils/pagination.util';
import { buildPrismaSort } from 'src/common/utils/sort.util';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentsBodyDto } from '../payment/dto/create-payment.dto';
import { ReversePaymentBodyDto } from '../payment/dto/reverse-payment.dto';
import { PaymentService } from '../payment/payment.service';
import { CreateReceivableBodyDto } from './dto/create-receivable.dto';
import { ListReceivablesBodyDto, ListReceivablesQueryDto } from './dto/list-receivable.dto';
import { UpdateReceivableBodyDto } from './dto/update-receivable.dto';
import { RECEIVABLE_FILTERS_MAP } from './receivable.filters';
import { RECEIVABLE_SORTABLE_FIELDS } from './receivable.sort';

@Injectable()
export class ReceivableService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createReceivable(data: CreateReceivableBodyDto) {
    const dueAt = DateTime.fromISO(data.dueAt, { zone: 'America/Sao_Paulo' }).toJSDate();
    const occurredAt = DateTime.fromISO(data.occurredAt, { zone: 'America/Sao_Paulo' }).toJSDate();

    await this.prismaService.receivable.create({
      data: {
        customerId: data.customerId,
        description: data.description,
        status: 'PENDING',
        total: data.total,
        type: 'IMMEDIATE',
        dueAt,
        occurredAt,
      },
    });
  }

  async cancelReceivable(receivableId: string) {
    const receivable = await this.prismaService.receivable.findFirstOrThrow({
      where: { id: receivableId },
      select: {
        paid: true,
        saleId: true,
      },
    });

    if (receivable.paid !== 0) {
      throw new BadRequestException('Estorne todas as allocations antes de excluir ou cancelar esta conta');
    }

    if (receivable.saleId) {
      await this.prismaService.receivable.update({ where: { id: receivableId }, data: { status: 'CANCELLED' } });
      return;
    }

    const allocationCount = await this.prismaService.paymentAllocation.count({ where: { receivableId } });

    if (allocationCount === 0) {
      await this.prismaService.receivable.delete({ where: { id: receivableId } });
    } else {
      await this.prismaService.receivable.update({ where: { id: receivableId }, data: { status: 'CANCELLED' } });
    }
  }

  async uncancelReceivable(receivableId: string) {
    const receivable = await this.prismaService.receivable.findFirstOrThrow({
      where: { id: receivableId },
      select: { status: true },
    });

    if (receivable.status !== 'CANCELLED') {
      throw new BadRequestException('Essa conta não está cancelada');
    }

    await this.prismaService.receivable.update({
      where: { id: receivableId },
      data: {
        status: 'PENDING',
      },
    });
  }

  async updateReceivable(receivableId: string, data: UpdateReceivableBodyDto) {
    const receivable = await this.prismaService.receivable.findFirstOrThrow({
      where: { id: receivableId },
      select: {
        status: true,
        saleId: true,
      },
    });

    if (receivable.status !== 'PENDING') {
      throw new BadRequestException('Essa conta possui registros financeiros ativos');
    }

    if (receivable.saleId) {
      throw new BadRequestException('Não é possível editar uma conta vinculada a uma venda');
    }

    const dates = {
      dueAt: DateTime.fromISO(data.dueAt, { zone: 'America/Sao_Paulo' }).toJSDate(),
      occurredAt: DateTime.fromISO(data.occurredAt, { zone: 'America/Sao_Paulo' }).toJSDate(),
    };

    await this.prismaService.receivable.update({
      where: { id: receivableId },
      data: {
        ...data,
        ...dates,
      },
    });
  }

  async deleteReceivable(receivableId: string) {
    await this.prismaService.receivable.delete({ where: { id: receivableId } });
  }

  async listTable(options: ListReceivablesQueryDto, filter: ListReceivablesBodyDto) {
    const sort = buildPrismaSort(options, RECEIVABLE_SORTABLE_FIELDS);
    const pagination = buildPrismaPagination(options);

    const queries = buildPrismaFilter(filter, RECEIVABLE_FILTERS_MAP);

    const count = await this.prismaService.receivableStats.count({
      where: {
        ...queries,
        description: { startsWith: options.search },
      },
    });

    const rows = await this.prismaService.receivableStats.findMany({
      where: {
        ...queries,
        description: { startsWith: options.search },
      },
      orderBy: sort || { id: 'desc' },
      ...pagination,
    });

    const result = {
      rowCount: count,
      pageCount: Math.ceil(count / 10),
      rows,
    };

    return result;
  }

  async findByCustomer(customerId: string) {
    const receivables = await this.prismaService.receivable.findMany({
      where: { customerId, status: { not: 'PAID' } },
      select: {
        id: true,
        type: true,
        total: true,
        paid: true,
        installmentIdx: true,
        installmentCount: true,
        dueAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return receivables;
  }

  async findAllocations(receivableId: string) {
    const allocations = await this.prismaService.paymentAllocation.findMany({
      where: {
        receivableId,
        reversalOfId: null,
        reversals: { none: {} },
      },
      select: {
        id: true,
        amount: true,
        payment: {
          select: {
            method: true,
            createdAt: true,
          },
        },
      },
    });

    const mappedAllocations = allocations.map((a) => {
      const { payment, ...allocation } = a;

      return {
        id: allocation.id,
        total: allocation.amount,
        method: payment.method,
        createdAt: payment.createdAt,
      };
    });

    return mappedAllocations;
  }

  async reverseAllocations(receivableId: string, data: ReversePaymentBodyDto) {
    return this.paymentService.reverseReceivable(receivableId, data);
  }

  async createPayments(data: CreatePaymentsBodyDto) {
    return this.paymentService.chargeReceivables(data);
  }
}

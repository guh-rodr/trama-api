import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCustomerBodyDto } from './dto/create-customer.dto';
import {
  CreateCustomerResponseDto,
  CustomerAutocompleteResponseDto,
  CustomerOverviewResponseDto,
  CustomerPreferencesDto,
  CustomerSaleResponseDto,
  CustomerStatsResponseDto,
  UpdateCustomerResponseDto,
} from './dto/customer-response.dto';
import { UpdateCustomerBodyDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCustomerBodyDto): Promise<CreateCustomerResponseDto> {
    const customer = await this.prisma.contact.create({
      data: {
        ...data,
        type: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
      },
    });

    return customer;
  }

  async getOverview(id: string): Promise<CustomerOverviewResponseDto> {
    const { sales, ...customer } = await this.prisma.contact.findUniqueOrThrow({
      where: { type: 'CUSTOMER', id },
      select: {
        name: true,
        phone: true,
        sales: {
          orderBy: { purchasedAt: 'desc' },
          take: 1,
        },
      },
    });

    return {
      ...customer,
      lastPurchaseAt: sales[0]?.purchasedAt,
    };
  }

  private async getMetrics(customerId: string) {
    const [salesMetrics, totalInflow] = await this.prisma.$transaction([
      this.prisma.sale.aggregate({
        where: { customerId },
        _sum: { total: true },
        _count: { id: true },
      }),

      this.prisma.cashFlowTransaction.aggregate({
        _sum: { value: true },
        where: {
          flow: 'INFLOW',
          sale: {
            customerId,
          },
        },
      }),
    ]);

    const totalSold = salesMetrics._sum.total || 0;
    const saleCount = salesMetrics._count.id || 0;
    const totalPaid = totalInflow._sum.value || 0;

    return {
      totalPaid,
      avgTicket: saleCount > 0 ? totalSold / saleCount : 0,
      debt: totalSold - totalPaid,
    };
  }

  private async getPreferences(id: string) {
    const preferences = await this.prisma.$queryRaw<CustomerPreferencesDto[]>`
      WITH base AS (
        SELECT pv.color, pv.size, si."categoryName"
        FROM "ProductVariant" pv
        JOIN "SaleItem" si ON si."variantId" = pv.id
        JOIN "Sale" s ON s.id = si."saleId"
        WHERE s."customerId" = ${id}
      )

      SELECT
      (
        SELECT color FROM base
        GROUP BY color
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS "topColor",

      (
        SELECT size FROM base
        GROUP BY size
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS "topSize",

      (
        SELECT "categoryName" FROM base
        GROUP BY "categoryName"
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS "topCategory";
    `;

    const { topColor, topCategory, topSize } = preferences[0];

    return {
      topCategory,
      topColor,
      topSize,
    };
  }

  async getStats(id: string): Promise<CustomerStatsResponseDto> {
    await this.prisma.contact.findUniqueOrThrow({ where: { type: 'CUSTOMER', id } });

    const metrics = await this.getMetrics(id);
    const preferences = await this.getPreferences(id);

    return {
      metrics,
      preferences,
    };
  }

  async getSales(customerId: string): Promise<CustomerSaleResponseDto[]> {
    const { sales } = await this.prisma.contact.findUniqueOrThrow({
      where: { id: customerId },
      select: {
        sales: {
          select: {
            id: true,
            total: true,
            profit: true,
            purchasedAt: true,
            transactions: {
              select: { value: true },
            },
            _count: { select: { items: true, transactions: true } },
          },
        },
      },
    });

    const result = sales.map((sale): CustomerSaleResponseDto => {
      const totalReceived = sale.transactions.reduce((acc, curr) => acc + curr.value, 0);

      const profitMargin = sale.total === 0 ? 0 : sale.profit / sale.total;
      const profitReceived = totalReceived * profitMargin;

      const isPaid = totalReceived === sale.total;

      return {
        id: sale.id,
        itemCount: sale._count.items,
        installmentCount: sale._count.transactions,
        status: isPaid ? 'paid' : 'pending',
        purchasedAt: sale.purchasedAt,

        total: sale.total,
        totalReceived: totalReceived,
        profit: sale.profit,
        profitReceived: profitReceived,
      };
    });

    return result;
  }

  async update(id: string, data: UpdateCustomerBodyDto): Promise<UpdateCustomerResponseDto> {
    const customer = await this.prisma.contact.update({
      where: { type: 'CUSTOMER', id },
      data,
    });

    return customer;
  }

  async listAutocomplete(search: string): Promise<CustomerAutocompleteResponseDto[]> {
    const customers = await this.prisma.contact.findMany({
      where: {
        type: 'CUSTOMER',
        OR: [{ name: { contains: search } }, { phone: { contains: search } }],
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return customers;
  }
}

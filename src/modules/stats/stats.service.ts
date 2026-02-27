import { Injectable } from '@nestjs/common';
import { DateTime, WeekdayNumbers } from 'luxon';
import { PrismaService } from 'src/prisma.service';
import { Method, Period } from './stats.type';

interface Range {
  label: string;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private getYearLabelsRanges(): Range[] {
    const labels = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    return labels.map((label, i) => {
      const startOfMonth = DateTime.fromObject({ month: i + 1 }, { zone: 'America/Sao_Paulo' }).startOf('month');
      const endOfMonth = startOfMonth.endOf('month');

      return {
        label,
        startDate: startOfMonth.toJSDate(),
        endDate: endOfMonth.toJSDate(),
      };
    });
  }

  private getMonthLabelsRanges(): Range[] {
    const now = DateTime.now().setZone('America/Sao_Paulo');

    const startOfMonth = now.startOf('month');
    const endOfMonth = now.endOf('month');

    let currentWeekStart = startOfMonth.startOf('week');

    const ranges: Range[] = [];
    let weekIndex = 1;

    while (currentWeekStart <= endOfMonth) {
      const currentWeekEnd = currentWeekStart.endOf('week');

      const startDate = DateTime.max(currentWeekStart, startOfMonth);
      const endDate = DateTime.min(currentWeekEnd, endOfMonth);

      ranges.push({
        label: `Semana ${weekIndex} (${startDate.day} à ${endDate.day})`,
        startDate: startDate.toJSDate(),
        endDate: endDate.toJSDate(),
      });

      currentWeekStart = currentWeekStart.plus({ weeks: 1 });
      weekIndex++;
    }

    return ranges;
  }

  private getWeekLabelsRanges(): Range[] {
    const labels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    return labels.map((label, i: WeekdayNumbers) => {
      const weekday = (i + 1) as WeekdayNumbers;

      const startOfDay = DateTime.fromObject({ weekday }, { zone: 'America/Sao_Paulo' }).startOf('day');
      const endOfDay = startOfDay.endOf('day');

      return {
        label,
        startDate: startOfDay.toJSDate(),
        endDate: endOfDay.toJSDate(),
      };
    });
  }

  private getChartLabelsByPeriod(period: Period) {
    const labels: Record<Period, () => Range[]> = {
      today: () => [],
      week: () => this.getWeekLabelsRanges(),
      month: () => this.getMonthLabelsRanges(),
      year: () => this.getYearLabelsRanges(),
    };

    return labels[period]();
  }

  private async getCashBasisChartData(ranges: Range[]) {
    const chartData = new Map<number, { col_1: number; col_2: number }>();

    await Promise.all(
      ranges.map(async (range, index) => {
        const result = await this.prisma.cashFlowTransaction.groupBy({
          by: ['flow'],
          where: {
            date: {
              gte: range.startDate,
              lte: range.endDate,
            },
          },
          _sum: { value: true },
        });

        const totalInflow = result.find((r) => r.flow === 'inflow')?._sum.value ?? 0;
        const totalOutflow = result.find((r) => r.flow === 'outflow')?._sum.value ?? 0;

        chartData.set(index, { col_1: totalInflow, col_2: totalOutflow });
      }),
    );

    return chartData;
  }

  private async getAccrualBasisChartData(ranges: Range[]) {
    const chartData = new Map<number, { col_1: number; col_2: number }>();

    await Promise.all(
      ranges.map(async (range, index) => {
        const sales = await this.prisma.sale.aggregate({
          where: { purchasedAt: { gte: range.startDate, lte: range.endDate } },
          _sum: { total: true },
        });

        const items = await this.prisma.saleItem.aggregate({
          where: { sale: { purchasedAt: { gte: range.startDate, lte: range.endDate } } },
          _sum: { costPrice: true },
        });

        const groupedTransactions = await this.prisma.cashFlowTransaction.groupBy({
          by: ['flow', 'saleId'],
          where: {
            category: {
              in: ['OPERATIONAL_EXPENSE', 'PERSONNEL_EXPENSE', 'TAX_EXPENSE', 'SALES_REVENUE', 'OTHER_INCOME'],
            },
            date: {
              gte: range.startDate,
              lte: range.endDate,
            },
          },
          _sum: { value: true },
        });

        const manualRevenue = groupedTransactions.find((t) => t.flow === 'inflow' && !t.saleId)?._sum.value ?? 0;
        const expensesOutflow = groupedTransactions.find((t) => t.flow === 'outflow')?._sum.value ?? 0;

        const grossRevenue = (sales._sum.total ?? 0) + manualRevenue;
        const costs = (items._sum.costPrice ?? 0) + expensesOutflow;

        chartData.set(index, { col_1: grossRevenue, col_2: costs });
      }),
    );

    return chartData;
  }

  async getChartData(period: Period, method: Method) {
    const ranges = this.getChartLabelsByPeriod(period);

    const methodsAction = {
      cash_basis: () => this.getCashBasisChartData(ranges),
      accrual_basis: () => this.getAccrualBasisChartData(ranges),
    };

    const chartData = await methodsAction[method]();

    const result = ranges.map((r, index) => ({
      label: r.label,
      ...chartData.get(index),
    }));

    return result;
  }

  // --------------------------------------------------------

  async getCardStatsInAccrualBasis(startDate: string, endDate: string) {
    const start = DateTime.fromISO(startDate, { zone: 'America/Sao_Paulo' }).startOf('day').toJSDate();
    const end = DateTime.fromISO(endDate, { zone: 'America/Sao_Paulo' }).endOf('day').toJSDate();

    const [saleAgg, saleItemAgg, transactionsAgg] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { purchasedAt: { gte: start, lte: end } },
        _sum: { total: true },
        _count: { id: true },
      }),

      this.prisma.saleItem.aggregate({
        where: { sale: { purchasedAt: { gte: start, lte: end } } },
        _sum: { costPrice: true },
      }),

      this.prisma.cashFlowTransaction.groupBy({
        by: ['flow', 'saleId'],
        where: {
          category: {
            in: ['OPERATIONAL_EXPENSE', 'PERSONNEL_EXPENSE', 'TAX_EXPENSE', 'SALES_REVENUE', 'OTHER_INCOME'],
          },
          date: {
            gte: start,
            lte: end,
          },
        },
        _sum: { value: true },
      }),
    ]);

    const expensesTotal = transactionsAgg.find((t) => t.flow === 'outflow')?._sum.value ?? 0;
    const manualRevenue = transactionsAgg.find((t) => t.flow === 'inflow' && !t.saleId)?._sum.value ?? 0;

    const saleCount = saleAgg._count.id ?? 0;
    const invoicing = manualRevenue + (saleAgg._sum.total ?? 0);
    const avgTicket = saleCount > 0 ? invoicing / saleCount : 0;

    const cpv = saleItemAgg._sum.costPrice ?? 0;
    const grossProfit = invoicing - cpv;
    const netProfit = grossProfit - expensesTotal;

    return {
      saleCount,
      invoicing,
      avgTicket,
      grossProfit,
      netProfit,
    };
  }

  async getCardStatsInCashBasis(startDate: string, endDate: string) {
    const start = DateTime.fromISO(startDate, { zone: 'America/Sao_Paulo' }).startOf('day').toJSDate();
    const end = DateTime.fromISO(endDate, { zone: 'America/Sao_Paulo' }).endOf('day').toJSDate();

    const [revenueAgg, inflowAgg, outflowAgg, historicalAgg] = await Promise.all([
      this.prisma.cashFlowTransaction.aggregate({
        where: {
          date: { gte: start, lte: end },
          category: 'SALES_REVENUE',
        },
        _sum: { value: true },
      }),

      this.prisma.cashFlowTransaction.aggregate({
        where: { date: { gte: start, lte: end }, flow: 'inflow' },
        _sum: { value: true },
      }),

      this.prisma.cashFlowTransaction.aggregate({
        where: { date: { gte: start, lte: end }, flow: 'outflow' },
        _sum: { value: true },
      }),

      this.prisma.cashFlowTransaction.groupBy({
        by: ['flow'],
        where: { date: { lte: end } },
        _sum: { value: true },
      }),
    ]);

    const receipt = revenueAgg._sum.value ?? 0;
    const inflowTotal = inflowAgg._sum.value ?? 0;
    const outflowTotal = outflowAgg._sum.value ?? 0;

    const periodResult = inflowTotal - outflowTotal;

    const histInflow = historicalAgg.find((x) => x.flow === 'inflow')?._sum.value ?? 0;
    const histOutflow = historicalAgg.find((x) => x.flow === 'outflow')?._sum.value ?? 0;

    const currentBalance = histInflow - histOutflow;

    return {
      receipt,
      periodResult,
      inflow: inflowTotal,
      outflow: outflowTotal,
      balance: currentBalance,
    };
  }

  async getTopCategories(startDate: string, endDate: string) {
    // o groupBy do prisma não suporta agrupar por campos de tabelas relacionadas, por isso o uso de raw query

    const query = await this.prisma.$queryRaw`
      SELECT
        si.categoryName as category,
        CAST(COUNT(si.id) AS FLOAT) AS count
      FROM SaleItem si
      JOIN Sale s ON si.saleId = s.id
      WHERE s.purchasedAt >= ${startDate} AND s.purchasedAt <= ${endDate}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5;
    `;

    return query;
  }

  async getStats(period: Period, method: Method, startDate: string, endDate: string) {
    const statsAction: Record<Method, () => unknown> = {
      accrual_basis: () => this.getCardStatsInAccrualBasis(startDate, endDate),
      cash_basis: () => this.getCardStatsInCashBasis(startDate, endDate),
    };

    const stats = await statsAction[method]();
    const topCategories = await this.getTopCategories(startDate, endDate);

    const metricsChart = await this.getChartData(period, method);

    return {
      cards: stats,
      topCategories,
      metricsChart,
    };
  }
}

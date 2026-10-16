import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { buildPrismaFilter } from 'src/common/utils/filter.util';
import { buildPrismaPagination } from 'src/common/utils/pagination.util';
import { buildPrismaSort } from 'src/common/utils/sort.util';
import { PrismaService } from 'src/prisma.service';
import { CATEGORY_FILTERS_MAP } from './category.filters';
import { CATEGORY_SORTABLE_FIELDS } from './category.sort';
import { CreateCategoryBodyDto } from './dto/create-category.dto';
import { ListCategoriesBodyDto, ListCategoriesQueryDto } from './dto/list-category.dto';
import { UpdateCategoryBodyDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoryBodyDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: data.name,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe uma categoria com esse nome.');
      }

      throw error;
    }
  }

  async listTable(options: ListCategoriesQueryDto, filter: ListCategoriesBodyDto) {
    const sort = buildPrismaSort(options, CATEGORY_SORTABLE_FIELDS);
    const pagination = buildPrismaPagination(options);

    const queries = buildPrismaFilter(filter, CATEGORY_FILTERS_MAP);

    const count = await this.prisma.categoryStats.count({
      where: {
        ...queries,
        name: { startsWith: options.search },
      },
    });

    const rows = await this.prisma.categoryStats.findMany({
      where: {
        ...queries,
        name: { startsWith: options.search },
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

  async listAutocomplete(search: string, fetchModels: boolean) {
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [
          {
            name: {
              startsWith: search,
            },
          },
          {
            products: {
              some: { name: { startsWith: search } },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        products: fetchModels ? { where: { deletedAt: null }, select: { id: true, name: true } } : undefined,
      },
      take: 5,
    });

    return categories;
  }

  async delete(id: string) {
    const category = await this.prisma.category.delete({ where: { id } });

    return category;
  }

  async update(id: string, data: UpdateCategoryBodyDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
      },
    });

    return category;
  }
}

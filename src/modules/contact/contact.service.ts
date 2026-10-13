import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { buildPrismaFilter } from 'src/common/utils/filter.util';
import { buildPrismaPagination } from 'src/common/utils/pagination.util';
import { buildPrismaSort } from 'src/common/utils/sort.util';
import { PrismaService } from 'src/prisma.service';
import { CONTACT_FILTERS_MAP } from './contact.filters';
import { CONTACT_SORTABLE_FIELDS } from './contact.sort';
import { CreateContactBodyDto } from './dto/create-contact.dto';
import { ListContactsBodyDto, ListContactsQueryDto } from './dto/list-contact.dto';
import { UpdateContactBodyDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateContactBodyDto) {
    console.log(data);
    return this.prismaService.contact.create({ data, select: { name: true, id: true } });
  }

  async findById(id: string) {
    return this.prismaService.contact.findFirstOrThrow({
      where: { id },
    });
  }

  async listTable(options: ListContactsQueryDto, filter: ListContactsBodyDto) {
    const sort = buildPrismaSort(options, CONTACT_SORTABLE_FIELDS);
    const pagination = buildPrismaPagination(options);

    const queries = buildPrismaFilter(filter, CONTACT_FILTERS_MAP);

    const count = await this.prismaService.contactStats.count({
      where: {
        ...queries,
        name: { startsWith: options.search },
      },
    });

    const rows = await this.prismaService.contactStats.findMany({
      where: {
        ...queries,
        OR: [{ name: { startsWith: options.search ?? '' } }, { phone: { startsWith: options.search ?? '' } }],
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

  async update(id: string, data: UpdateContactBodyDto) {
    const contact = await this.prismaService.contact.update({
      where: { id },
      data,
    });

    return contact;
  }

  async archive(contactId: string) {
    console.log('CHEGOU AQUI!');

    const now = DateTime.now().setZone('America/Sao_Paulo').toJSDate();

    return this.prismaService.contact.update({
      where: { id: contactId },
      data: {
        deletedAt: now,
      },
    });
  }

  async unarchive(contactId: string) {
    return this.prismaService.contact.update({
      where: { id: contactId },
      data: {
        deletedAt: null,
      },
    });
  }

  async delete(contactId: string) {
    return this.prismaService.contact.delete({
      where: { id: contactId },
    });
  }
}

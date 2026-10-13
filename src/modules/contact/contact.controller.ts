import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactBodyDto } from './dto/create-contact.dto';
import { ListContactsBodyDto, ListContactsQueryDto } from './dto/list-contact.dto';
import { UpdateContactBodyDto } from './dto/update-contact.dto';

@Controller('/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async create(@Body() body: CreateContactBodyDto) {
    return this.contactService.create(body);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.contactService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateContactBodyDto) {
    return this.contactService.update(id, body);
  }

  @Post('/list')
  async listTable(@Query() query: ListContactsQueryDto, @Body() body: ListContactsBodyDto) {
    return this.contactService.listTable(query, body);
  }

  @Post(':id/archive')
  async cancel(@Param('id') contactId: string) {
    return this.contactService.archive(contactId);
  }

  @Post(':id/unarchive')
  async uncancel(@Param('id') contactId: string) {
    return this.contactService.unarchive(contactId);
  }

  @Delete(':id')
  async delete(@Param('id') contactId: string) {
    return this.contactService.delete(contactId);
  }
}

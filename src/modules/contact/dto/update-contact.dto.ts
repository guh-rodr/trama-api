import { PartialType } from '@nestjs/mapped-types';
import { CreateContactBodyDto } from './create-contact.dto';

export class UpdateContactBodyDto extends PartialType(CreateContactBodyDto) {}

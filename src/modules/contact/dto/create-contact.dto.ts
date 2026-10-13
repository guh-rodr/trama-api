import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { ContactType } from 'generated/prisma/enums';

export class CreateContactBodyDto {
  @IsString()
  name: string;

  @IsIn(['CUSTOMER', 'SUPPLIER'])
  type: ContactType;

  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @IsOptional()
  note?: string;

  @Transform(({ value }) => (value === '' ? null : value))
  @IsOptional()
  @IsString()
  phone?: string;

  @Transform(({ value }) => (value === '' ? null : value))
  @IsOptional()
  @Matches(/^(\d{11}|\d{14})$/)
  document?: string;
}

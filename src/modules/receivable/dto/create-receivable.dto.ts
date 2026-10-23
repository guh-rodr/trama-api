import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { toCents } from 'src/common/utils/currency.util';

export class CreateReceivableBodyDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @Transform(({ value }) => toCents(value))
  total: number;

  @IsDateString()
  occurredAt: string;

  @IsDateString({ strict: true })
  dueAt: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

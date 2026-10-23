import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { toCents } from 'src/common/utils/currency.util';

export class CreatePaymentsBodyDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  customerId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  receivables: string[];

  @IsIn(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD'])
  method: 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD';

  @IsNumber()
  @Transform(({ value }) => (value ? toCents(value) : undefined))
  value: number;
}

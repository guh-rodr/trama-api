import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsNumber } from 'class-validator';
import { toCents } from 'src/common/utils/currency.util';

export class CreateInstallmentBodyDto {
  @ApiProperty({ description: 'Valor da parcela', example: 60 })
  @IsNumber()
  @Transform(({ value }) => toCents(value))
  value: number;

  @ApiProperty({ description: 'Data de pagamento (primeira parcela)', example: '2026-01-16' })
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  paidAt: string;
}

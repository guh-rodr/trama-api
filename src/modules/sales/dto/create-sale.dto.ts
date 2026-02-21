import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { toCents } from 'src/common/utils/currency.util';
import { Color } from '../enums/color.enum';
import { Print } from '../enums/print.enum';
import { Size } from '../enums/size.enum';
import { CreateInstallmentBodyDto } from './create-installment.dto';

class SaleItem {
  @ApiProperty({ description: 'ID do modelo (CUID)', example: 'cmlvoby7y000...' })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty({ description: 'Cor', example: 'black', enum: Color })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ description: 'Estampa', example: 'plain', enum: Print })
  @IsString()
  @IsNotEmpty()
  print: string;

  @ApiProperty({ description: 'Tamanho', example: 'm', enum: Size })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ description: 'Preço de compra', example: 120 })
  @IsNumber()
  @Transform(({ value }) => toCents(value))
  costPrice: number;

  @ApiProperty({ description: 'Preço de venda', example: 230 })
  @IsNumber()
  @Transform(({ value }) => toCents(value))
  salePrice: number;
}

export class CreateSaleBodyDto {
  @ApiProperty({ description: 'ID do cliente (CUID)', example: 'ch72gsb32000...' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Data da compra', example: '2026-01-16' })
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  purchasedAt: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItem)
  items: SaleItem[];

  @ApiProperty({ description: 'Dados da parcela (opcional)', required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateInstallmentBodyDto)
  installment: CreateInstallmentBodyDto | null;
}

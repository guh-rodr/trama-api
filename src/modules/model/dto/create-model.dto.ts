import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { toCents } from 'src/common/utils/currency.util';

class ModelVariant {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsNumber()
  @Transform(({ value }) => (value ? toCents(value) : undefined))
  costPrice: number;

  @IsNumber()
  @Transform(({ value }) => (value ? toCents(value) : undefined))
  salePrice: number;

  @IsInt()
  quantity: number;
}

export class CreateModelBodyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? toCents(value) : undefined))
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? toCents(value) : undefined))
  salePrice?: number;

  @IsObject()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ModelVariant)
  variants: ModelVariant[];
}

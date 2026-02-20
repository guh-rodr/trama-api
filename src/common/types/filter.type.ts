import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SingleFilter {
  @ApiProperty({ description: 'Campo a ser filtrado', example: 'debt' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ description: 'Operação', example: 'greater_than' })
  @IsString()
  @IsNotEmpty()
  operator: string;

  @ApiProperty({ description: 'Valor a ser aplicado no campo', example: '200' })
  @IsOptional()
  @IsNotEmpty()
  value?: string;
}

export class FilterDto {
  @ApiPropertyOptional({ description: 'Operador lógico', example: 'AND' })
  @IsOptional()
  @IsIn(['OR', 'AND'])
  logical?: 'OR' | 'AND';

  @ApiPropertyOptional({ description: 'Filtros', type: [SingleFilter] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleFilter)
  filters?: SingleFilter[];
}

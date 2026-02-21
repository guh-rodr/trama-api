import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { FilterDto } from 'src/common/types/filter.type';
import { SortDto } from 'src/common/types/sort.type';

export class ListSalesQueryDto extends SortDto {
  @ApiProperty({ example: 1, description: 'Página a ser acessada' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  // page?: number = 1;
  page?: number;

  @ApiProperty({ description: 'Buscar por nome ou telefone do cliente' })
  @IsOptional()
  @IsString()
  // search?: string = '';
  search?: string;
}

export class ListSalesBodyDto extends FilterDto {}

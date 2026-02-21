import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class DeleteManySaleBodyDto {
  @ApiProperty({ example: ['ch72gsb32000...', 'ckqtls704000...'], description: 'IDs das vendas' })
  @IsArray()
  ids: string[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerResponseDto {
  @ApiProperty({ example: 'ch72gsb32000...', description: 'ID do cliente (CUID)' })
  id: string;

  @ApiProperty({ example: 'Gustavo Rodrigues', description: 'Nome completo do cliente' })
  name: string;
}

export class UpdateCustomerResponseDto {
  @ApiProperty({ example: 'ch72gsb32000...', description: 'ID do cliente (CUID)' })
  id: string;

  @ApiProperty({ example: 'Gustavo Rodrigues', description: 'Nome completo do cliente' })
  name: string;

  @ApiPropertyOptional({ example: '99 99999-9999', description: 'Telefone do cliente' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Prefere atendimento via Whatsapp', description: 'Observação geral' })
  note?: string;

  @ApiProperty({ example: '2026-01-10T10:30:00.000Z', description: 'Data de registro do cliente' })
  createdAt?: Date;
}

export class CustomerOverviewResponseDto {
  @ApiProperty({ example: 'Gustavo Rodrigues', description: 'Nome completo do cliente' })
  name: string;

  @ApiPropertyOptional({ example: '99 99999-9999', description: 'Telefone do cliente' })
  phone?: string;

  @ApiPropertyOptional({ example: '2026-01-10T10:30:00.000Z', description: 'Data da última compra' })
  lastPurchaseAt?: Date;
}

export class CustomerSaleResponseDto {
  @ApiProperty({ example: 'cixf02ym000...', description: 'ID da venda (CUID)' })
  id: string;

  @ApiProperty({ example: 3, description: 'Quantidade de itens' })
  itemCount: number;

  @ApiProperty({ example: 1, description: 'Quantidade de parcelas' })
  installmentCount: number;

  @ApiProperty({ example: 'paid', description: 'Status atual', enum: ['paid', 'pending'] })
  status: 'paid' | 'pending';

  @ApiProperty({ example: '2026-01-10T10:30:00.000Z', description: 'Data da compra' })
  purchasedAt: Date;

  @ApiProperty({ example: 349.9, description: 'Valor total' })
  total: number;

  @ApiProperty({ example: 349.9, description: 'Valor recebido até o momento' })
  totalReceived: number;

  @ApiProperty({ example: 139.9, description: 'Lucro total' })
  profit: number;

  @ApiProperty({ example: 139.9, description: 'Lucro recebido até o momento' })
  profitReceived: number;
}

class CustomerMetricsDto {
  @ApiProperty({ example: 468, description: 'Valor total que o cliente já pagou' })
  totalPaid: number;

  @ApiProperty({ example: 129.9, description: 'Ticket médio do cliente' })
  avgTicket: number;

  @ApiProperty({ example: 59.9, description: 'Dívida total do cliente' })
  debt: number;
}

export class CustomerPreferencesDto {
  @ApiProperty({ example: 'Blusas', description: 'Categoria preferida do cliente' })
  topCategory: string;

  @ApiProperty({ example: 'Marrom', description: 'Cor preferida do cliente' })
  topColor: string;

  @ApiProperty({ example: 'P', description: 'Tamanho mais comprado pelo cliente' })
  topSize: string;
}

export class CustomerStatsResponseDto {
  @ApiProperty({
    description: 'Métricas do cliente',
    type: CustomerMetricsDto,
  })
  metrics: CustomerMetricsDto;

  @ApiProperty({
    description: 'Preferências do cliente',
    type: CustomerPreferencesDto,
  })
  preferences: CustomerPreferencesDto;
}

export class CustomerAutocompleteResponseDto extends CreateCustomerResponseDto {}

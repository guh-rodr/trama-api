import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnauthorizedErrorResponseDto, ValidationErrorResponseDto } from 'src/common/dtos/error-responses.dto';
import { CustomerService } from './customer.service';
import { CreateCustomerBodyDto } from './dto/create-customer.dto';
import { UpdateCustomerBodyDto } from './dto/update-customer.dto';

@Controller('/customers')
@ApiResponse({ status: 401, description: 'Erro de autenticação', type: UnauthorizedErrorResponseDto })
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Registra um novo cliente' })
  @ApiResponse({ status: 400, description: 'Erro de validação nos campos enviados', type: ValidationErrorResponseDto })
  @Post()
  create(@Body() body: CreateCustomerBodyDto) {
    return this.customerService.create(body);
  }

  @ApiOperation({ summary: 'Atualiza dados do cliente' })
  @ApiResponse({ status: 404, description: 'Nenhum cliente encontrado com esse ID' })
  @ApiResponse({ status: 400, description: 'Erro de validação nos campos enviados', type: ValidationErrorResponseDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCustomerBodyDto) {
    return this.customerService.update(id, body);
  }

  @ApiOperation({ summary: 'Retorna informações gerais do cliente' })
  @ApiResponse({ status: 404, description: 'Nenhum cliente encontrado com esse ID' })
  @Get(':id/overview')
  getInfo(@Param('id') id: string) {
    return this.customerService.getOverview(id);
  }

  @ApiOperation({ summary: 'Retorna uma lista de vendas relacionadas ao cliente' })
  @ApiResponse({ status: 404, description: 'Nenhum cliente encontrado com esse ID' })
  @Get(':id/sales')
  getSales(@Param('id') id: string) {
    return this.customerService.getSales(id);
  }

  @ApiOperation({ summary: 'Retorna métricas e preferências do cliente' })
  @Get(':id/stats')
  @ApiResponse({ status: 404, description: 'Nenhum cliente encontrado com esse ID' })
  getStats(@Param('id') id: string) {
    return this.customerService.getStats(id);
  }

  @ApiOperation({ summary: 'Retorna os 5 primeiros clientes relacionados a uma busca (id e name apenas)' })
  @Get('/autocomplete')
  listAutocomplete(@Query('search') search: string) {
    return this.customerService.listAutocomplete(search || '');
  }
}

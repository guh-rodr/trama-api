import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateProductBodyDto } from './dto/create-product.dto';
import { BulkDeleteProductsBodyDto } from './dto/delete-product.dto';
import { ListProductsBodyDto, ListProductsQueryDto } from './dto/list-products.dto';
import { UpdateProductBodyDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@Controller('/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Get('/autocomplete')
  @Public()
  listAutocomplete(@Query('search') search: string) {
    return this.productService.listAutocomplete(search || '');
  }

  @Post('/list')
  listTable(@Query() query: ListProductsQueryDto, @Body() body: ListProductsBodyDto) {
    return this.productService.listTable(
      {
        page: query.page || 1,
        ...query,
      },
      body,
    );
  }

  @Get('/:id/variants')
  findVariants(@Param('id') id: string) {
    return this.productService.findVariants(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Post('/bulk-delete')
  bulkDelete(@Body() body: BulkDeleteProductsBodyDto) {
    return this.productService.bulkDelete(body);
  }

  @Post()
  create(@Body() body: CreateProductBodyDto) {
    return this.productService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductBodyDto) {
    return this.productService.update(id, body);
  }
}

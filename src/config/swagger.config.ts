import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Trama API')
    .setDescription(
      'API desenvolvida para proporcionar controle operacional e financeiro completo. Esta documentação detalha todos os endpoints, desde métricas de desempenho até a gestão de produtos, fluxo de caixa, clientes e vendas.',
    )
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);
}

<img width="359" height="160" alt="trama-banner" src="https://github.com/user-attachments/assets/cf85f7ea-2933-403e-b727-a0befd58ad48" />

<br>
<br>

## 💡 Sobre

Este repositório inclui o back-end do sistema de ERP **Trama**, uma solução de gestão para o comércio local direcionado ao segmento de moda. A API foi construída seguindo os princípios de arquitetura modular do NestJS, focando em escalabilidade e manutenibilidade.

## ✨ Principais funcionalidades

- **Autenticação**: Registro e sessões via JWT, com hashing de senhas utilizando argon2 e uso de Guards do NestJS para controle de acesso.

- **Dashboard**: Endpoints otimizados para agregação de dados, incluindo soma de receitas, ticket médio, total de vendas, etc...

- **Fluxo de Caixa:** Controle de transações de entrada e saída separados por categorias, aumentando a precisão das métricas e cálculos.

- **Categorias e Modelos:** CRUD completo com validação via DTOs (utilizando o class-validator) e relacionamento entre entidades para garantir integridade dos dados.

- **Clientes:** CRUD completo para controle de clientes, incluindo endpoints para histórico de compras e métricas/preferências por cliente.

- **Error Handling:** Tratamento global para gerenciar erros inesperados na aplicação e evitar enviá-los para o front-end.

## 📚 Stack

- [Typescript](https://www.typescriptlang.org/)
- [NestJS](https://nestjs.com/)
- [Prisma (com SQLite)](https://www.prisma.io/)
- [Front-end (repositório)](https://github.com/guh-rodr/trama-erp)

## ⚙️ Como rodar o projeto

### 1. Pré-requisitos:

- Node.js (18.0 ou superior)
- pnpm

> [!WARNING]
> Se não tiver o pnpm instalado, use o seguinte comando antes de prosseguir: `npm install -g pnpm`

### 2. Clonar o repositório

```bash
git clone https://github.com/guh-rodr/trama-api.git
```

### 3. Instalar as dependências

```bash
cd trama-api
pnpm install
```

### 4. Configurar as variáveis de ambiente

```bash
# Copia o arquivo de exemplo para o arquivo que o sistema vai ler
cp .env.example .env
```

Altere o valor de `JWT_SECRET` para uma chave longa e aleatória.

### 5. Iniciar o banco de dados

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

### 6. Iniciar o projeto

```
pnpm start:dev
```

## 📄 Documentação da API

A API conta com documentação interativa gerada com o Swagger (OpenAPI)

### Versão local

Após iniciar o servidor, acesse:
http://localhost:3000/docs

### Versão online

Documentação disponível em:
https://trama-api-y4dl.onrender.com/docs

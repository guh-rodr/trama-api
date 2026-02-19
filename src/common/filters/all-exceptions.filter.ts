import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpExceptionBody, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from 'generated/prisma/client';

interface ExceptionResponse extends HttpExceptionBody {
  validation?: Record<string, string[]>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let errorType = 'InternalServerError';
    let validation: ExceptionResponse['validation'] = undefined;

    if (exception instanceof HttpException) {
      // erros lançados manualmente ou pelo nest

      httpStatus = exception.getStatus();
      const response = exception.getResponse() as ExceptionResponse;

      errorType = response.error;

      if (typeof response?.message === 'string') {
        message = response.message;
      }

      if (typeof response?.validation === 'object' && response?.validation !== null) {
        errorType = 'ValidationError';
        validation = response.validation;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // erros lançados pelo prisma

      switch ((exception as Prisma.PrismaClientKnownRequestError).code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = 'Este registro já existe no sistema.';
          errorType = 'Conflict';
          break;

        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado.';
          errorType = 'NotFound';
          break;

        case 'P2003':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Não é possível realizar esta operação devido a dependências de dados.';
          errorType = 'ForeignKeyConstraint';
          break;

        default:
          console.error('[Erro Prisma]:', exception);
          break;
      }
    } else {
      // erros genéricos/inesperados

      console.error('[Erro Inesperado]:', exception);
    }

    const response = {
      statusCode: httpStatus,
      error: errorType,
      message,
      validation,
    };

    httpAdapter.reply(ctx.getResponse(), response, httpStatus);
  }
}

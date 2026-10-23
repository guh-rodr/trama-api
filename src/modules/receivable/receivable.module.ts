import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentModule } from '../payment/payment.module';
import { PaymentService } from '../payment/payment.service';
import { ReceivableController } from './receivable.controller';
import { ReceivableService } from './receivable.service';

@Module({
  imports: [PaymentModule],
  controllers: [ReceivableController],
  providers: [PrismaService, PaymentService, ReceivableService],
})
export class ReceivableModule {}

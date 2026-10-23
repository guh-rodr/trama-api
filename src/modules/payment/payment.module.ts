import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PaymentService } from './payment.service';

@Module({
  providers: [PrismaService, PaymentService],
})
export class PaymentModule {}

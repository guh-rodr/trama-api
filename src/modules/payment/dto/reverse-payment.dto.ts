import { ArrayNotEmpty, IsArray, IsEnum, IsISO8601, IsNotEmpty, IsString } from 'class-validator';
import { PaymentType } from 'generated/prisma/enums';

export class ReversePaymentBodyDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  allocations: string[];

  @IsNotEmpty()
  @IsISO8601({ strict: true })
  date: string;

  @IsEnum(PaymentType)
  reason: PaymentType;
}

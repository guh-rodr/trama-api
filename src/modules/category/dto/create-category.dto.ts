import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryBodyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

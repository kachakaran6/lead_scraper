import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateWhatsappAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class SendWhatsappMessageDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  businessId?: string;

  @IsString()
  @IsNotEmpty()
  toPhone: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

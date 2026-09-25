import { IsString, IsNotEmpty, IsEmail, IsOptional, IsUUID } from "class-validator";

export class SendOutreachEmailDto {
  @IsUUID()
  @IsOptional()
  smtpAccountId?: string;

  @IsString()
  @IsOptional()
  businessId?: string;

  @IsEmail()
  @IsNotEmpty()
  toEmail: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  templateId?: string;
}

export class QueryOutreachEmailDto {
  @IsString()
  @IsOptional()
  businessId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}

import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsEmail } from "class-validator";

export class CreateSmtpAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsBoolean()
  @IsOptional()
  secure?: boolean;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  skipVerify?: boolean;
}

export class TestSmtpAccountDto {
  @IsEmail()
  @IsOptional()
  recipientEmail?: string;
}

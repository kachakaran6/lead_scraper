import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Must be a valid email address" })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password must contain uppercase, lowercase, and a number or special character",
  })
  password!: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Must be a valid email address" })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Must be a valid email address" })
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password must contain uppercase, lowercase, and a number or special character",
  })
  newPassword!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: "Password must contain uppercase, lowercase, and a number or special character",
  })
  newPassword!: string;
}

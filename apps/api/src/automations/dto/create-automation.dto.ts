import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

export class AutomationSequenceStepDto {
  @IsNumber()
  stepIndex: number;

  @IsString()
  @IsNotEmpty()
  channel: string; // EMAIL | WHATSAPP

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  customSubject?: string;

  @IsString()
  @IsOptional()
  customBody?: string;

  @IsNumber()
  @IsOptional()
  delayDays?: number;

  @IsNumber()
  @IsOptional()
  delayHours?: number;

  @IsString()
  @IsOptional()
  condition?: string; // ALWAYS | NOT_OPENED | NOT_REPLIED
}

export class CreateAutomationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  searchQuery: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  dailyLeadTarget?: number;

  @IsNumber()
  @IsOptional()
  totalLeadTarget?: number;

  @IsString()
  @IsOptional()
  sendWindowStart?: string;

  @IsString()
  @IsOptional()
  sendWindowEnd?: string;

  @IsArray()
  @IsOptional()
  daysOfWeek?: number[];

  @IsOptional()
  leadFilters?: Record<string, any>;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AutomationSequenceStepDto)
  sequences?: AutomationSequenceStepDto[];
}

import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AutomationSequenceStepDto } from "./create-automation.dto";

export class UpdateAutomationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  searchQuery?: string;

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

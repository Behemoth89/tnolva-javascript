import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    example: 'Acme Corporation',
    description: 'Company name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: 'acme-corporation',
    description: 'URL-friendly slug',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: { timezone: 'UTC', locale: 'en-US' },
    description: 'Company settings as JSON object',
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the company is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

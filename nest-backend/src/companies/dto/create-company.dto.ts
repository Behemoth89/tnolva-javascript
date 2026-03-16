import {
  IsString,
  IsOptional,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Company name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'acme-corporation',
    description: 'URL-friendly slug (auto-generated from name if not provided)',
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
}

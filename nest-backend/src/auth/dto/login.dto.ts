import { IsEmail, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  password!: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'Optional company ID for multi-company login',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

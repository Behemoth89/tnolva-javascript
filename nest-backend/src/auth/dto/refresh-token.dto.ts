import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Valid refresh token',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}

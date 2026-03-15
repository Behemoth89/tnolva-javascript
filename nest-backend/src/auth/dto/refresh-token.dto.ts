import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Valid JWT access token (for future use - currently token is obtained from Authorization header)',
    required: false,
  })
  @IsString()
  accessToken?: string;
}

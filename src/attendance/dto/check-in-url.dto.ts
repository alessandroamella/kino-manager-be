import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckInUrlDto {
  @ApiProperty({
    description: 'Check-in URL',
    example: 'https://example.com/check-in/12345',
  })
  @IsString()
  url: string;
}

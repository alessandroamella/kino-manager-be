import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AccessTokenDto {
  @ApiProperty({
    description:
      'Access token to be used for authentication with Bearer scheme',
  })
  @IsString()
  access_token: string;
}

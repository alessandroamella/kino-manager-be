import { ApiProperty } from '@nestjs/swagger';
import { MemberDataDto } from './member-data.dto';

export class MemberDataWithTokenDto extends MemberDataDto {
  @ApiProperty({
    description: 'Access token',
  })
  accessToken: string;
}

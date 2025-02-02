import { ApiProperty, PickType } from '@nestjs/swagger';
import { SignupDto } from './signup.dto';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPwdDto extends PickType(SignupDto, ['password']) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

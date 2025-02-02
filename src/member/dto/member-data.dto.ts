import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { MemberDto } from './member.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class DeviceInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mobile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  os?: string;
}
export class MemberDataExtendedDto extends OmitType(MemberDto, [
  'password',
  'resetPwdJwt',
  'userAgent',
]) {
  @ApiPropertyOptional({
    type: DeviceInfoDto,
  })
  deviceInfo: DeviceInfoDto | null;
}

export class MemberDataDto extends OmitType(MemberDataExtendedDto, [
  'streetName',
  'streetNumber',
  'postalCode',
  'city',
  'province',
  'country',
  'ipAddress',
  'deviceInfo',
]) {}

import { ApiProperty, PickType } from '@nestjs/swagger';
import { MemberDataDto } from 'member/dto/member-data.dto';
import { AttendanceDto } from './attendance.dto';

export class GetAttendanceDto extends PickType(AttendanceDto, [
  'id',
  'checkInUTC',
]) {
  @ApiProperty({
    description: 'Member data',
    type: MemberDataDto,
  })
  member: MemberDataDto;
}

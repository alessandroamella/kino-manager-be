import { ApiProperty, PickType } from '@nestjs/swagger';
import { AttendanceDto } from 'attendance/dto/attendance.dto';
import { GetOpeningDayDto } from './get-opening-day.dto';

class MemberIdDto extends PickType(AttendanceDto, ['memberId', 'checkInUTC']) {}

export class GetOpeningDayWithAttendeesDto extends GetOpeningDayDto {
  @ApiProperty({
    type: [MemberIdDto],
    description: 'List of members who attended the event',
  })
  attendances: MemberIdDto[];
}

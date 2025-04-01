import { ApiProperty, PickType } from '@nestjs/swagger';
import { AttendanceDto } from 'attendance/dto/attendance.dto';
import { OpeningDayDto } from 'opening-day/dto/opening-day.dto';

class GetAttendanceOpeningDayDto extends PickType(OpeningDayDto, [
  'name',
  'openTimeUTC',
  'eventPicturesUrl',
  'eventThumbnailUrl',
]) {}

export class GetAttendancesDto extends PickType(AttendanceDto, ['checkInUTC']) {
  @ApiProperty({
    type: GetAttendanceOpeningDayDto,
    description: 'Opening day of the attendance',
    example: {
      name: 'Opening Day 1',
      openTimeUTC: new Date('2023-10-01T00:00:00Z'),
      eventPicturesUrl: 'https://example.com/event-pictures',
      eventThumbnailUrl: 'https://example.com/event-thumbnail',
    },
  })
  openingDay: GetAttendanceOpeningDayDto;
}

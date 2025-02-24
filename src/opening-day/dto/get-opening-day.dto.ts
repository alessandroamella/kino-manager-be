import { PickType } from '@nestjs/swagger';
import { OpeningDayDto } from './opening-day.dto';

export class GetOpeningDayDto extends PickType(OpeningDayDto, [
  'id',
  'openTimeUTC',
  'closeTimeUTC',
]) {}

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetOpeningDayDto } from 'opening-day/dto/get-opening-day.dto';
import { OpeningDayService } from 'opening-day/opening-day.service';

@ApiTags('opening-day')
@Controller('opening-day')
export class OpeningDayController {
  constructor(private readonly openingDayService: OpeningDayService) {}

  @Get()
  @ApiOperation({ summary: 'Get opening days' })
  @ApiOkResponse({
    description: 'List of opening days',
    type: [GetOpeningDayDto],
  })
  async getOpeningDays(): Promise<GetOpeningDayDto[]> {
    return this.openingDayService.getOpeningDays();
  }
}

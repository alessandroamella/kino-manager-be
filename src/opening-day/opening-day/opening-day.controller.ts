import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { GetOpeningDayWithAttendeesDto } from 'opening-day/dto/get-opening-day-with-attendees.dto';
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
    return this.openingDayService.getOpeningDays(false);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('with-attendees')
  @ApiOperation({ summary: 'Get opening days with attendees' })
  @ApiOkResponse({
    description: 'List of opening days with attendees',
    type: [GetOpeningDayWithAttendeesDto],
  })
  async getOpeningDaysWithAttendees(): Promise<
    GetOpeningDayWithAttendeesDto[]
  > {
    return this.openingDayService.getOpeningDays(true);
  }
}

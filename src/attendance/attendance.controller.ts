import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Member } from 'member/member.decorator';
import { AttendanceService } from './attendance.service';
import { GetAttendanceDto } from './dto/get-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get event QR code' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiOkResponse({
    description: 'Event QR code',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Get('event-qr/:id')
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    type: 'number',
  })
  async getEventQrCode(
    @Param('id', ParseIntPipe) eventId: number,
  ): Promise<StreamableFile> {
    const qrImage = await this.attendanceService.getEventQrCode(eventId);
    return new StreamableFile(qrImage, {
      type: 'image/png',
    });
  }

  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get attendee list' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  @ApiOkResponse({
    description: 'Attendance list',
    type: [GetAttendanceDto],
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    type: 'number',
  })
  @Get('event/:id')
  async getAttendance(
    @Param('id', ParseIntPipe) eventId: number,
  ): Promise<GetAttendanceDto[]> {
    return this.attendanceService.getAttendance(eventId);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Check in to event' })
  @ApiNotFoundResponse({
    description: 'Event not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid QR code',
  })
  @ApiOkResponse({ description: 'Checked in' })
  @ApiParam({
    name: 'jwt',
    description: 'JWT token from QR code',
    type: 'string',
  })
  @Post('check-in/:jwt')
  async checkIn(
    @Member('userId', ParseIntPipe) userId: number,
    @Param('jwt') jwt: string,
  ) {
    return this.attendanceService.logAttendance(userId, jwt);
  }
}

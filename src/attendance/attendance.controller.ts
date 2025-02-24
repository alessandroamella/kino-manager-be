import {
  Controller,
  Post,
  StreamableFile,
  UseGuards,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Member } from 'member/member.decorator';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @ApiOperation({ summary: 'Generate attendance QR code image' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiCreatedResponse({
    description: 'QR code image',
    content: {
      'image/webp': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('qr-code')
  async generateQrCode(
    @Member('userId', ParseIntPipe) userId: number,
  ): Promise<StreamableFile> {
    const imgBuffer = await this.attendanceService.generateQrImage(userId);
    return new StreamableFile(imgBuffer, {
      type: 'image/webp',
    });
  }

  @ApiOperation({ summary: 'Check in attendance' })
  @ApiNotFoundResponse({
    description: 'Attendance not found (not checked in) or event not found',
  })
  @ApiOkResponse({ description: 'Check-in result' })
  @Get('is-checked-in')
  async checkIn(@Member('userId', ParseIntPipe) userId: number) {
    return this.attendanceService.getUserCheckIn(userId);
  }
}

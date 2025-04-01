import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { formatInTimeZone } from 'date-fns-tz';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import QRCode, { QRCodeToBufferOptions } from 'qrcode';
import { Logger } from 'winston';
import { EventJwtDto } from './dto/event-jwt.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // generate JWT for event used to validate attendance
  private async generateEventJwt(eventId: number): Promise<string> {
    const event = await this.prisma.openingDay.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      this.logger.warn(`Event ${eventId} not found in generateEventJwt`);
      throw new BadRequestException('No event found');
    }

    const payload: EventJwtDto = { id: event.id };

    const signed = await this.jwtService.signAsync(payload);
    this.logger.debug(
      `Generated event JWT for event ${eventId}: ${signed} (${new TextEncoder().encode(signed).length} bytes)`,
    );

    return signed;
  }

  private async generateQrImage(
    payload: string,
    options?: QRCodeToBufferOptions,
  ): Promise<Buffer> {
    try {
      const pngBuffer: Buffer = await QRCode.toBuffer(payload, {
        errorCorrectionLevel: 'M',
        margin: 4,
        width: 300,
        type: 'png',
        ...options,
      });

      return pngBuffer;
    } catch (error) {
      this.logger.error('Failed to generate QR code:');
      this.logger.error(error);
      throw error;
    }
  }

  public async getEventCheckInUrl(eventId: number): Promise<string> {
    const payload = await this.generateEventJwt(eventId);

    const url = new URL('/profile', this.config.get('FRONTEND_URL'));
    url.search = new URLSearchParams({
      'check-in': payload,
    }).toString();

    return url.toString();
  }

  // used by admins to generate QR codes for events
  public async getEventQrCode(eventId: number): Promise<Buffer> {
    const url = await this.getEventCheckInUrl(eventId);

    const qrImage = await this.generateQrImage(url.toString(), {
      margin: 4,
      width: 1200,
    });
    return qrImage;
  }

  private formatLogTime(date: Date): string {
    return formatInTimeZone(date, 'Europe/Rome', 'dd/MM/yyyy HH:mm:ss');
  }

  public async logAttendance(userId: number, qrPayload: string): Promise<void> {
    try {
      const { id: eventId } = await this.jwtService.verifyAsync<EventJwtDto>(
        qrPayload,
        {
          secret: process.env.JWT_SECRET,
        },
      );

      const event = await this.prisma.openingDay.findUnique({
        where: { id: eventId },
      });
      if (!event) {
        this.logger.warn(`Event ${eventId} not found for attendance check-in`);
        throw new NotFoundException('No event found');
      }

      // check if already exists
      const existing = await this.prisma.attendance.findFirst({
        where: { memberId: userId, openingDayId: event.id },
      });
      if (existing) {
        this.logger.warn(
          `User ${userId} already checked in at ${this.formatLogTime(existing.checkInUTC)} for event ${event.id}`,
        );
        return;
      }

      const checkInTime = new Date();

      const existingAttendance = await this.prisma.attendance.findFirst({
        where: { memberId: userId, openingDayId: event.id },
      });
      if (existingAttendance) {
        this.logger.warn(
          `User ${userId} already checked in at ${this.formatLogTime(checkInTime)} for event ${event.id}`,
        );
        return;
      }

      await this.prisma.attendance.create({
        data: {
          memberId: userId,
          openingDayId: event.id,
          checkInUTC: checkInTime,
        },
      });

      this.logger.info(
        `User ${userId} checked in at event ${event.id} at ${this.formatLogTime(checkInTime)} for event ${event.id}`,
      );
      return;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      } else if (err.name === 'TokenExpiredError') {
        this.logger.info(`Expired QR code: ${err.message}`);
        throw new UnauthorizedException('Expired QR code');
      }
      this.logger.info(`Invalid QR code: ${err?.message || err}`);
      throw new UnauthorizedException('Invalid QR code');
    }
  }
}

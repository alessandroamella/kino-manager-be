import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { addHours, getUnixTime, subHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { GetOpeningDayDto } from 'opening-day/dto/get-opening-day.dto';
import { PrismaService } from 'prisma/prisma.service';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { Logger } from 'winston';
import { AttendanceJwtPayloadDto } from './dto/attendance-jwt-payload.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private async generateQrPayload(userId: number): Promise<string> {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload: AttendanceJwtPayloadDto = {
      u: userId,
      d: getUnixTime(new Date()),
    };

    const jwtOptions = {
      expiresIn: '1h',
      header: {
        alg: 'HS256',
        typ: 'JWT',
      },
    };

    const signed = await this.jwtService.signAsync(payload, jwtOptions);

    this.logger.debug(
      `Generated QR payload for user ${userId}: ${JSON.stringify(payload)} => ${signed} (${
        new TextEncoder().encode(signed).length
      } bytes)`,
    );

    return signed;
  }

  async generateQrImage(userId: number): Promise<Buffer> {
    const payload = await this.generateQrPayload(userId);

    try {
      const pngBuffer: Buffer = await QRCode.toBuffer(payload, {
        errorCorrectionLevel: 'M',
        margin: 4,
        width: 300,
        type: 'png',
      });

      return sharp(pngBuffer).webp().toBuffer();
    } catch (error) {
      this.logger.error('Failed to generate QR code as WebP', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  private async getClosestEvent(date: Date): Promise<GetOpeningDayDto | null> {
    return this.prisma.openingDay.findFirst({
      where: {
        openTimeUTC: { lte: addHours(date, 3) },
        closeTimeUTC: { gte: subHours(date, 3) },
      },
      select: { id: true, openTimeUTC: true, closeTimeUTC: true },
    });
  }

  async logAttendance(qrPayload: string): Promise<void> {
    try {
      const payload =
        await this.jwtService.verifyAsync<AttendanceJwtPayloadDto>(qrPayload);
      const userId = payload.u;
      const checkInTime = new Date(payload.d * 1000);

      const user = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        throw new NotFoundException('User not found');
      }

      const event = await this.getClosestEvent(checkInTime);
      if (!event) {
        this.logger.warn(
          `No event found for user ${userId} at ${this.formatLogTime(checkInTime)}`,
        );
        throw new NotFoundException('No event found');
      }

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
          memberId: user.id,
          openingDayId: event.id,
          checkInUTC: checkInTime,
        },
      });

      this.logger.info(
        `User ${userId} checked in at ${this.formatLogTime(checkInTime)} for event ${event.id}`,
      );
      return;
    } catch (err) {
      this.logger.info(`Invalid QR code: ${err?.message || err}`);
      throw new UnauthorizedException('Invalid QR code');
    }
  }

  private formatLogTime(date: Date): string {
    return formatInTimeZone(date, 'Europe/Rome', 'dd/MM/yyyy HH:mm:ss');
  }

  // tries to guess event ID from the current date
  async getUserCheckIn(userId: number): Promise<void> {
    const now = new Date();
    const event = await this.getClosestEvent(now);
    if (!event) {
      throw new NotFoundException('No event found');
    }

    const data = await this.prisma.attendance.findFirst({
      where: { memberId: userId, openingDayId: event.id },
      select: { checkInUTC: true },
    });
    if (!data) {
      throw new NotFoundException('No check-in found');
    }
  }
}

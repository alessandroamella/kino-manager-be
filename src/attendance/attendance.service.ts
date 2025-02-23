import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { AttendanceJwtPayloadDto } from './dto/attendance-jwt-payload.dto';
import { addHours, getUnixTime, subHours } from 'date-fns';
import QRCode from 'qrcode';
import { formatInTimeZone } from 'date-fns-tz';
import sharp from 'sharp';

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

  async logAttendance(qrPayload: string): Promise<HttpStatus.OK> {
    let payload: AttendanceJwtPayloadDto;
    try {
      payload =
        await this.jwtService.verifyAsync<AttendanceJwtPayloadDto>(qrPayload);
    } catch (err) {
      this.logger.debug(
        `Invalid QR code in logAttendance ${qrPayload}: ${err?.message || err}`,
      );
      throw new UnauthorizedException('Invalid QR code');
    }

    const userId = payload.u;
    const date = new Date(payload.d * 1000);

    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      this.logger.warn(`User ${userId} not found in logAttendance`);
      throw new NotFoundException('User not found');
    }

    const event = await this.prisma.openingDay.findFirst({
      where: {
        openTimeUTC: {
          gte: subHours(date, 1),
        },
        closeTimeUTC: {
          lte: addHours(date, 1),
        },
      },
      select: { id: true, openTimeUTC: true },
    });
    if (!event) {
      this.logger.warn(
        `No event found for user ${userId} at ${formatInTimeZone(
          date,
          'Europe/Rome',
          'dd/MM/yyyy HH:mm:ss',
        )}`,
      );
      throw new NotFoundException('No event found');
    }

    await this.prisma.attendance.create({
      data: {
        memberId: user.id,
        openingDayId: event.id,
        checkInUTC: date,
      },
    });

    this.logger.info(
      `User ${userId} checked in at ${formatInTimeZone(
        date,
        'Europe/Rome',
        'dd/MM/yyyy HH:mm:ss',
      )} with QR code for event ${event.id} (event of ${formatInTimeZone(
        event.openTimeUTC,
        'Europe/Rome',
        'dd/MM/yyyy HH:mm:ss',
      )})`,
    );

    return HttpStatus.OK;
  }
}

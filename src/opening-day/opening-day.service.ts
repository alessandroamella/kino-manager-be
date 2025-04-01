import { Injectable } from '@nestjs/common';
import { addMonths, subMonths } from 'date-fns';
import { PrismaService } from 'prisma/prisma.service';
import { GetOpeningDayWithAttendeesDto } from './dto/get-opening-day-with-attendees.dto';
import { GetOpeningDayDto } from './dto/get-opening-day.dto';

@Injectable()
export class OpeningDayService {
  constructor(private readonly prisma: PrismaService) {}

  // Overload 1: When includeAttendees is specifically 'true'
  async getOpeningDays(
    includeAttendees: true,
  ): Promise<GetOpeningDayWithAttendeesDto[]>;

  // Overload 2: When includeAttendees is specifically 'false'
  async getOpeningDays(includeAttendees: false): Promise<GetOpeningDayDto[]>;

  async getOpeningDays(
    includeAttendees: boolean,
  ): Promise<(GetOpeningDayDto | GetOpeningDayWithAttendeesDto)[]> {
    return this.prisma.openingDay.findMany({
      where: {
        openTimeUTC: {
          // return interval [now - 1 month, now + 2 months]
          gte: subMonths(new Date(), 1),
          lte: addMonths(new Date(), 2),
        },
      },
      select: {
        id: true,
        openTimeUTC: true,
        closeTimeUTC: true,
        name: true,
        eventThumbnailUrl: true,
        attendances: includeAttendees
          ? {
              select: {
                memberId: true,
                checkInUTC: true,
              },
            }
          : undefined,
      },
      orderBy: {
        openTimeUTC: 'asc',
      },
    });
  }
}

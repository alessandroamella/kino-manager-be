import { Injectable } from '@nestjs/common';
import { GetOpeningDayDto } from './dto/get-opening-day.dto';
import { PrismaService } from 'prisma/prisma.service';
import { addMonths, subMonths } from 'date-fns';

@Injectable()
export class OpeningDayService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpeningDays(): Promise<GetOpeningDayDto[]> {
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
      },
      orderBy: {
        openTimeUTC: 'asc',
      },
    });
  }
}

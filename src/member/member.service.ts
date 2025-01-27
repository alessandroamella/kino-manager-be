import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { MemberDataDto } from './dto/member-data.dto';
import { memberSelect } from './member.select';

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    setTimeout(async () => {
      const members = await this.prisma.member.findMany({
        where: {
          NOT: {
            verificationDate: null,
          },
        },
      });
      for (const m of members) {
        const updated = await this.prisma.member.update({
          where: { id: m.id },
          data: {
            memberSince: m.verificationDate,
          },
        });
        console.log('Updated member', updated);
      }
      console.log('Updated members', members.length);
    }, 5000);
  }

  async getMember(id: number): Promise<MemberDataDto> {
    this.logger.debug(`Getting member with id ${id}`);
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: memberSelect,
    });
    if (!member) {
      throw new UnauthorizedException();
    }
    return member;
  }
}

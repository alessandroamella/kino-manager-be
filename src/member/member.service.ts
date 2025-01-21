import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { MemberDataDto } from './dto/member-data.dto';

@Injectable()
export class MemberService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getMember(id: number): Promise<MemberDataDto> {
    this.logger.debug(`Getting member with id ${id}`);
    return this.prismaService.member.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: false,
        codiceFiscale: true,
        birthDate: true,
        birthProvince: true,
        birthCountry: true,
        verificationMethod: true,
        verificationDate: true,
        createdAt: true,
        updatedAt: false,
      },
    });
  }
}

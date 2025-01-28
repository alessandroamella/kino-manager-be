import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { memberSelect } from './member.select';
import { MemberDataWithTokenDto } from './dto/member-data-with-token.dto';
import { AuthService } from 'auth/auth.service';

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getMember(id: number): Promise<MemberDataWithTokenDto> {
    this.logger.debug(`Getting member with id ${id}`);
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: memberSelect,
    });
    if (!member) {
      throw new UnauthorizedException();
    }
    const { access_token } = await this.authService.generateAccessToken({
      userId: member.id,
      email: member.email,
      isAdmin: member.isAdmin,
    });
    return {
      ...member,
      accessToken: access_token,
    };
  }

  async addSignature(userId: number, signatureB64: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        signatureR2Key: true,
        codiceFiscale: true,
      },
    });
    if (!member) {
      throw new NotFoundException();
    } else if (member.signatureR2Key !== '') {
      // default value is epsilon for users that registered before it was added
      throw new UnauthorizedException(
        "Signature already present and can't be overwritten",
      );
    }
    this.logger.debug(`Adding signature to member with id ${userId}`);

    const signatureR2Key = await this.authService.uploadBase64Signature(
      signatureB64,
      member.codiceFiscale,
    );
    await this.prisma.member.update({
      where: { id: userId },
      data: { signatureR2Key },
    });
    return HttpStatus.OK;
  }
}

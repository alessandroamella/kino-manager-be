import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { MailService } from 'mail/mail.service';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { JwtPayload } from './dto/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async login({ email, password }: LoginDto): Promise<AccessTokenDto> {
    this.logger.debug(`Validating member with email: ${email}`);

    const member = await this.prisma.member.findFirst({
      where: { email },
      select: {
        id: true,
        password: true,
        email: true,
        isAdmin: true,
      },
    });
    if (!member) {
      throw new NotFoundException();
    }

    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayload = {
      userId: member.id,
      email: member.email,
      isAdmin: member.isAdmin,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(data: SignupDto) {
    const exists = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email: data.email },
          { codiceFiscale: data.codiceFiscale || null },
          {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        ],
      },
    });
    if (exists) {
      throw new ConflictException();
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const { id, email } = await this.prisma.member.create({
      data: { ...data, password: hashedPassword },
    });
    this.logger.info(`Member ${id} with email: ${data.email} has been created`);

    this.mailService.sendEmail(
      email,
      'Benvuto al Kinó Café',
      await readFile(join(process.cwd(), 'emails/new-account.ejs'), {
        encoding: 'utf-8',
      }),
      {
        firstName: data.firstName,
        createdAt: format(new Date(), 'dd MMM yyyy', { locale: it }),
      },
    );

    return this.login({ email, password: data.password });
  }
}

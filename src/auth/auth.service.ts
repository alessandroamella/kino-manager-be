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
import { memberSelect } from 'member/member.select';
import { IstatService } from 'istat/istat.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly istatService: IstatService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    setTimeout(async () => {
      const members = await this.prisma.member.findMany({
        select: {
          id: true,
          address: true,
        },
        where: {
          postalCode: null,
        },
      });

      for (const m of members) {
        // e.g. "Via della Cartiera, 16, 41018 San Cesario Sul Panaro MO, Italia"
        // => we need to get:
        // streetName
        // streetNumber
        // postalCode
        // city
        // province
        // country
        const split = m.address.split(', ');
        const [streetName, streetNumber, mix] =
          split.length === 2
            ? [null, null, ...split]
            : split.length === 4
              ? split
              : [split[0], null, ...split.slice(1)];
        const postalCode = mix.split(' ')[0];
        // city is after postalCode but before last element
        const city = mix.split(' ').slice(1, -1).join(' ');
        // province is the last element
        const province = mix.split(' ').pop();
        const country = 'IT';

        console.log({
          streetName,
          streetNumber,
          postalCode,
          city,
          province,
          country,
        });

        await this.prisma.member.update({
          where: { id: m.id },
          data: {
            streetName,
            streetNumber: streetNumber ? parseInt(streetNumber) : undefined,
            postalCode,
            city,
            province,
            country,
          },
        });
      }
    }, 500);
  }

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

    return this.generateAccessToken({
      userId: member.id,
      email: member.email,
      isAdmin: member.isAdmin,
    });
  }

  async generateAccessToken(data: JwtPayload): Promise<AccessTokenDto> {
    return {
      access_token: this.jwtService.sign(data),
    };
  }

  async signup(data: SignupDto) {
    const exists = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email: data.email },
          { codiceFiscale: data.codiceFiscale || 'ignored' },
          { phoneNumber: data.phoneNumber },
        ],
      },
      select: memberSelect,
    });
    if (exists) {
      this.logger.warn(
        `Member with already exists with email ${data.email} or CF ${data.codiceFiscale || 'ignored'}: ${JSON.stringify(
          exists,
        )}`,
      );
      throw new ConflictException();
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const correctlyCasedComune =
      data.birthComune && (await this.istatService.getComune(data.birthComune));
    const { id, email } = await this.prisma.member.create({
      data: {
        ...data,
        birthComune: data.birthComune || correctlyCasedComune,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
      },
    });
    this.logger.info(`Member ${id} with email ${email} has been created`);

    this.mailService
      .sendEmail(
        { email, name: data.firstName },
        'Benvenuto al Kinó Café',
        await readFile(join(process.cwd(), 'emails/new-account.ejs'), {
          encoding: 'utf-8',
        }),
        {
          firstName: data.firstName,
          createdAt: format(new Date(), 'dd MMM yyyy', { locale: it }),
        },
      )
      .then(() => {
        this.logger.info(`Welcome email sent to ${email}`);
      })
      .catch((error) => {
        this.logger.error(`Error sending welcome email to ${email}: ${error}`);
      });

    return this.login({ email, password: data.password });
  }
}

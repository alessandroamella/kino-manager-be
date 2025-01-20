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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async login({ email, password }: LoginDto): Promise<AccessTokenDto> {
    this.logger.debug(`Validating member with email: ${email}`);

    const member = await this.prisma.member.findFirst({ where: { email } });
    if (!member) {
      throw new NotFoundException();
    }

    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const payload = { userId: member.id, email: member.email };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(data: SignupDto) {
    const exists = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email: data.email },
          data.codiceFiscale && { codiceFiscale: data.codiceFiscale },
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
    return this.login({ email, password: data.password });
  }
}

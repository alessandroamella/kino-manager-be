import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { LocalStrategyReturnDto } from './dto/local-strategy-return.dto';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async validateUser({ email, password }: LocalStrategyReturnDto) {
    this.logger.debug(`Validating member with email: ${email}`);

    const member = await this.prisma.member.findFirst({
      where: { email },
      select: { password: true },
    });
    if (!member) {
      throw new NotFoundException();
    }

    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    return member;
  }

  async login(user: { email: string; userId: number }) {
    const payload = { email: user.email, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(data: SignupDto) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const { id, email } = await this.prisma.member.create({
      data: { ...data, password: hashedPassword },
    });
    this.logger.info(`Member ${id} with email: ${data.email} has been created`);
    return this.login({ userId: id, email });
  }
}

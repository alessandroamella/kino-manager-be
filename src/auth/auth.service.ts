import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { format, formatDate } from 'date-fns';
import { it } from 'date-fns/locale';
import { JwtPayload } from './dto/jwt-payload.type';
import { memberSelect } from 'member/member.select';
import { IstatService } from 'istat/istat.service';
import CodiceFiscale from 'codice-fiscale-js';
import { R2Service } from 'r2/r2.service';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly istatService: IstatService,
    private readonly r2Service: R2Service,
    private readonly config: ConfigService,
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

  private b64WebpToBuffer(base64Image: string): Buffer {
    const base64Data = base64Image.replace(/^data:image\/webp;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  async uploadBase64Signature(
    signatureB64: string,
    codiceFiscale?: string,
  ): Promise<string> {
    const signatureR2Key = `${this.config.get(
      'R2_SIGNATURES_FOLDER',
    )}/${formatDate(
      new Date(),
      'yyyy-MM-dd_HH-mm-ss',
    )}_${codiceFiscale || uuidv4()}`;
    try {
      await this.r2Service.uploadFile({
        key: signatureR2Key,
        body: this.b64WebpToBuffer(signatureB64),
        contentType: 'image/webp',
      });
      this.logger.debug(`Signature uploaded to R2 with key ${signatureR2Key}`);
      return signatureR2Key;
    } catch (err) {
      this.logger.error(`Failed to upload signature to R2: ${err}`);
      throw new InternalServerErrorException('Failed to upload signature');
    }
  }

  async signup(_data: SignupDto) {
    const { signatureB64, ...data } = _data;

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

    const signatureR2Key = await this.uploadBase64Signature(
      signatureB64,
      data.codiceFiscale,
    );

    this.logger.debug(`Signature uploaded to R2 with key ${signatureR2Key}`);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    let cfData: ReturnType<typeof CodiceFiscale.computeInverse> | undefined;
    try {
      cfData =
        data.codiceFiscale && CodiceFiscale.computeInverse(data.codiceFiscale);
    } catch (err) {
      this.logger.debug(`Failed to compute inverse CF: ${err}`);
    }
    const comuneName: string | null = data.birthComune || cfData?.birthplace;
    const comuneData =
      comuneName && (await this.istatService.getComuneData(comuneName));

    const { id, email } = await this.prisma.member.create({
      data: {
        ...data,
        birthComune: comuneData?.nome || data.birthComune,
        birthProvince: comuneData?.provincia.sigla || data.birthProvince,
        password: hashedPassword,
        signatureR2Key,
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
        await readFile(
          join(process.cwd(), 'resources/emails/new-account.ejs'),
          {
            encoding: 'utf-8',
          },
        ),
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

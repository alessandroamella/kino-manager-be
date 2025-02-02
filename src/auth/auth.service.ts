import {
  BadRequestException,
  ConflictException,
  HttpStatus,
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
import { addMinutes, format, formatDate, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';
import { JwtPayload } from './dto/jwt-payload.type';
import { memberSelect } from 'member/member.select';
import { IstatService } from 'istat/istat.service';
import CodiceFiscale from 'codice-fiscale-js';
import { R2Service } from 'r2/r2.service';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { ForgotPwdDto } from './dto/forgot-pwd.dto';
import { ResetPwdDto } from './dto/reset-pwd.dto';

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
      access_token: this.jwtService.sign(data, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '1h',
      }),
    };
  }

  async b64ImgToWebpBuffer(base64Image: string): Promise<Buffer> {
    try {
      this.logger.debug(
        `Converting base64 image ${base64Image.slice(0, 20)}...${base64Image.slice(-20)} to WebP`,
      );

      const mimeTypeRegex = /^data:(image\/(webp|png|jpeg));base64,/;
      const mimeTypeMatch = base64Image.match(mimeTypeRegex);

      if (!mimeTypeMatch || mimeTypeMatch.length < 3) {
        this.logger.warn(
          `Invalid base64 image format: ${base64Image.slice(0, 50)}..., type match array: ${JSON.stringify(mimeTypeMatch)}`,
        );
        throw new BadRequestException(
          'Invalid base64 image format or unsupported MIME type.',
        );
      }

      const format = mimeTypeMatch[2];
      const base64Data = base64Image.replace(mimeTypeRegex, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      if (format === 'webp') {
        this.logger.debug('Image is already in WebP format');
        return imageBuffer;
      }

      this.logger.debug(`Converting image from ${format} to WebP`);

      return sharp(imageBuffer).webp().toBuffer();
    } catch (error) {
      this.logger.error(
        `Error converting base64 to webp: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to convert image to webp format.',
      );
    }
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
        body: await this.b64ImgToWebpBuffer(signatureB64),
        contentType: 'image/webp',
      });
      this.logger.debug(`Signature uploaded to R2 with key ${signatureR2Key}`);
      return signatureR2Key;
    } catch (err) {
      this.logger.error(`Failed to upload signature to R2: ${err}`);
      throw new InternalServerErrorException('Failed to upload signature');
    }
  }

  async forgotPassword({ email }: ForgotPwdDto): Promise<HttpStatus.OK> {
    const member = await this.prisma.member.findFirst({
      where: { email },
      select: { id: true, resetPwdJwt: true },
    });
    if (!member) {
      throw new UnauthorizedException('Email not found');
    }

    // try to parse jwt to check if it's valid
    if (member.resetPwdJwt) {
      try {
        this.logger.debug(
          `Verifying reset password "${member.resetPwdJwt}" token for ${email}`,
        );
        const data = await this.jwtService.verify(member.resetPwdJwt, {
          secret: this.config.get('JWT_SECRET'),
        });
        this.logger.debug(
          `Reset password token still valid for ${email}: ${JSON.stringify(
            data,
          )}`,
        );
        if (isBefore(new Date(), addMinutes(new Date(data.iat * 1000), 5))) {
          // token was issued less than 5 minutes ago, prevent spam
          this.logger.debug(
            `Token issued less than 5 minutes ago for ${email}`,
          );
          return HttpStatus.OK;
        }
      } catch (err) {
        // check if expired
        if (err.name === 'TokenExpiredError') {
          // ok, expired token
          this.logger.debug(`Reset password token expired for ${email}`);
        } else {
          this.logger.error(`Error verifying reset password token: ${err}`);
          throw new InternalServerErrorException('Failed to verify token');
        }
      }
    } else {
      this.logger.debug(`No reset password token found for ${email}`);
    }

    const resetPwdJwt = this.jwtService.sign({ email }, { expiresIn: '1h' });
    this.logger.debug(`Generated reset password token for ${email}`);

    const updatedMember = await this.prisma.member.update({
      where: { id: member.id },
      data: { resetPwdJwt },
      select: {
        firstName: true,
        updatedAt: true,
      },
    });

    this.mailService
      .sendEmail(
        { name: updatedMember.firstName, email },
        'Reimposta la tua password',
        await readFile(join(process.cwd(), 'resources/emails/reset-pwd.ejs'), {
          encoding: 'utf-8',
        }),
        {
          firstName: updatedMember.firstName,
          createdAt: format(updatedMember.updatedAt, 'dd MMM yyyy', {
            locale: it,
          }),
          resetUrl: `${this.config.get(
            'FRONTEND_URL',
          )}/auth/reset-password?token=${resetPwdJwt}`,
        },
      )
      .then(() => {
        this.logger.info(`Reset password email sent to ${email}`);
      })
      .catch((error) => {
        this.logger.error(
          `Error sending reset password email to ${email}: ${error}`,
        );
      });

    return HttpStatus.OK;
  }

  async resetPassword({ token, password }: ResetPwdDto): Promise<ForgotPwdDto> {
    let email: string;
    try {
      const data = await this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      email = data.email;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        this.logger.debug(`Reset password token expired for ${email}`);
        throw new UnauthorizedException('Token expired');
      } else {
        this.logger.error(`Error verifying reset password token: ${err}`);
        throw new InternalServerErrorException('Failed to verify token');
      }
    }

    const member = await this.prisma.member.findFirst({
      where: { email },
      select: { id: true, resetPwdJwt: true },
    });
    if (!member) {
      this.logger.warn(`Member not found in resetPassword for email ${email}`);
      throw new UnauthorizedException('Email not found');
    } else if (member.resetPwdJwt !== token) {
      this.logger.debug(
        `Invalid reset password token for email ${email}: ${member.resetPwdJwt} !== provided ${token}`,
      );
      throw new UnauthorizedException('Invalid token');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.prisma.member.update({
      where: { email },
      data: { password: hashedPassword },
    });

    this.logger.info(`Password reset for ${email}`);

    return { email };
  }

  async signup(_data: SignupDto): Promise<AccessTokenDto> {
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

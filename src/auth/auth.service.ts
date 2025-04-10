import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { decodeFiscalCode, type FiscalCodeData } from 'codice-fiscale-ts';
import { addMinutes, format, formatDate, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';
import { IstatService } from 'istat/istat.service';
import { MailService } from 'mail/mail.service';
import { memberSelect } from 'member/member.select';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from 'prisma/prisma.service';
import { R2Service } from 'r2/r2.service';
import { SharedService } from 'shared/shared.service';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { AccessTokenDto } from './dto/access-token.dto';
import { ForgotPwdDto } from './dto/forgot-pwd.dto';
import { JwtPayload } from './dto/jwt-payload.type';
import { LoginDto } from './dto/login.dto';
import { ResetPwdDto } from './dto/reset-pwd.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly istatService: IstatService,
    private readonly r2Service: R2Service,
    private readonly config: ConfigService,
    private readonly shared: SharedService,
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
      // jwts last for 2 weeks
      access_token: await this.jwtService.signAsync(data, { expiresIn: '2w' }),
    };
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
        body: await this.r2Service.b64ImgToWebpBuffer(signatureB64),
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
        const data = await this.jwtService.verifyAsync<
          ForgotPwdDto & { iat: number }
        >(member.resetPwdJwt);
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

    const resetPwdJwt = await this.jwtService.signAsync(
      { email },
      { expiresIn: '1h' },
    );
    this.logger.debug(`Generated reset password token for ${email}`);

    const updatedMember = await this.prisma.member.update({
      where: { id: member.id },
      data: { resetPwdJwt },
      select: {
        firstName: true,
        updatedAt: true,
        gender: true,
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
          genderLetter: this.shared.getGenderSuffixItalian(
            updatedMember.gender,
          ),
        },
      )
      .then(() => {
        this.logger.info(`Reset password email sent to ${email}`);
      })
      .catch((error) => {
        this.logger.error(`Error sending reset password email to ${email}:`);
        this.logger.error(error);
        console.log(error); // just to make sure it shows up in the logs
      });

    return HttpStatus.OK;
  }

  async resetPassword({ token, password }: ResetPwdDto): Promise<ForgotPwdDto> {
    let email: string;
    try {
      const data = await this.jwtService.verifyAsync<ForgotPwdDto>(token);
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

    let cfData: FiscalCodeData | undefined;
    try {
      cfData =
        data.codiceFiscale && (await decodeFiscalCode(data.codiceFiscale));
    } catch (err) {
      this.logger.debug(`Failed to compute inverse CF: ${err}`);
    }

    const { id, email } = await this.prisma.member.create({
      data: {
        ...data,
        birthComune:
          cfData.foreignCountry !== 'IT'
            ? null
            : cfData.birthPlace || data.birthComune,
        birthProvince:
          cfData.foreignCountry !== 'IT'
            ? null
            : cfData.birthProvince || data.birthProvince,
        birthCountry: cfData.foreignCountry || data.birthCountry,
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
        `Benvenut${this.shared.getGenderSuffixItalian(data.gender)} al Kinó Café`,
        await readFile(
          join(process.cwd(), 'resources/emails/new-account.ejs'),
          {
            encoding: 'utf-8',
          },
        ),
        {
          firstName: data.firstName,
          createdAt: format(new Date(), 'dd MMM yyyy', { locale: it }),
          genderLetter: this.shared.getGenderSuffixItalian(data.gender),
        },
      )
      .then(() => {
        this.logger.info(`Welcome email sent to ${email}`);
      })
      .catch((error) => {
        this.logger.error(`Error sending welcome email to ${email}:`);
        this.logger.error(error);
        console.log(error); // just to make sure it shows up in the logs
      });

    return this.login({ email, password: data.password });
  }
}

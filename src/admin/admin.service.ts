import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Workbook } from 'exceljs';
import { isNil, omitBy } from 'lodash';
import { MailService } from 'mail/mail.service';
import { MemberDataExtendedDto } from 'member/dto/member-data.dto';
import { memberSelect, memberSelectExtended } from 'member/member.select';
import { MembershipPdfService } from 'membership-pdf/membership-pdf.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { I18nService } from 'nestjs-i18n';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from 'prisma/prisma.service';
import { R2Service } from 'r2/r2.service';
import { SharedService } from 'shared/shared.service';
import { UAParser } from 'ua-parser-js';
import { Logger } from 'winston';
import { AddMembershipCardDto } from './dto/add-membership-card.dto';
import { MembershipCardDto } from './dto/MembershipCard.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly mailService: MailService,
    private readonly r2Service: R2Service,
    private readonly membershipPdfService: MembershipPdfService,
    private readonly config: ConfigService,
    private readonly shared: SharedService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async exportMembersToExcel(): Promise<Buffer> {
    this.logger.debug(
      'Starting export of members and membership cards to Excel',
    );

    // Fetch Members Data
    const members = await this.prisma.member.findMany({
      select: memberSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!members || members.length === 0) {
      this.logger.warn('No members found to export');
    }

    // Fetch Membership Cards Data
    const membershipCards = await this.prisma.membershipCard.findMany({
      include: {
        member: true, // Include related member data
      },
      orderBy: {
        number: 'asc',
      },
    });

    if (!membershipCards || membershipCards.length === 0) {
      this.logger.warn('No membership cards found to export');
    }

    const workbook = new Workbook();

    // Members Worksheet
    const membersWorksheet = workbook.addWorksheet('Members');

    // Define headers in Italian for Members
    membersWorksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome', key: 'firstName', width: 20 },
      { header: 'Cognome', key: 'lastName', width: 20 },
      { header: 'Numero di Tessera', key: 'membershipCardNumber', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Codice Fiscale', key: 'codiceFiscale', width: 30 },
      { header: 'Paese di Nascita', key: 'birthCountry', width: 20 },
      {
        header: 'Data di Nascita',
        key: 'birthDate',
        width: 15,
        style: { numFmt: 'yyyy-mm-dd' },
      },
      { header: 'Admin', key: 'isAdmin', width: 20 },
      { header: 'Comune di Nascita', key: 'birthComune', width: 23 },
      {
        header: 'Tesserato dal',
        key: 'memberSince',
        width: 30,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      {
        header: 'Data di Creazione',
        key: 'createdAt',
        width: 30,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      { header: 'Numero di Telefono', key: 'phoneNumber', width: 20 },
      { header: 'Indirizzo', key: 'address', width: 60 },
    ];

    // Add rows from members data to Members Worksheet
    members.forEach((member) => {
      membersWorksheet.addRow({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        membershipCardNumber: member.membershipCardNumber,
        email: member.email,
        codiceFiscale: member.codiceFiscale,
        birthCountry: this.i18n.t(`countries.${member.birthCountry}`, {
          lang: 'it',
        }),
        birthDate: member.birthDate,
        isAdmin: member.isAdmin ? 'Sì' : 'No',
        birthComune: member.birthComune,
        memberSince: member.memberSince,
        createdAt: member.createdAt,
        phoneNumber: member.phoneNumber,
        address: member.address,
      });
    });

    // Tessere Worksheet
    const tessereWorksheet = workbook.addWorksheet('Tessere');

    // Define headers in Italian for Tessere
    tessereWorksheet.columns = [
      { header: 'Numero Tessera', key: 'number', width: 15 },
      { header: 'ID Utente', key: 'userId', width: 10 },
      { header: 'Nome Utente', key: 'userFirstName', width: 20 },
      { header: 'Cognome Utente', key: 'userLastName', width: 20 },
    ];

    // Add rows from membership cards data to Tessere Worksheet
    membershipCards.forEach((card) => {
      tessereWorksheet.addRow({
        number: card.number,
        userId: card.member?.id || null, // Display user ID if member exists, otherwise null
        userFirstName: card.member?.firstName || null, // Display user first name if member exists, otherwise null
        userLastName: card.member?.lastName || null, // Display user last name if member exists, otherwise null
      });
    });

    // Generate buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();
    this.logger.debug(
      'Excel file buffer generated successfully with Members and Tessere sheets',
    );
    return excelBuffer as Buffer;
  }

  async getUsers(): Promise<MemberDataExtendedDto[]> {
    const users = await this.prisma.member.findMany({
      select: memberSelectExtended,
      orderBy: {
        createdAt: 'asc',
      },
    });
    return users.map(({ userAgent, ...user }) => {
      if (userAgent) {
        const uaResult = new UAParser(userAgent).getResult();
        return {
          ...user,
          deviceInfo: omitBy(
            {
              browser: uaResult.browser.name,
              cpu: uaResult.cpu.architecture,
              device: uaResult.device.model && uaResult.device.toString(),
              mobile: uaResult.device.is('mobile'),
              os: uaResult.os.name,
            },
            isNil,
          ),
        };
      }
      return { ...user, deviceInfo: null };
    });
  }

  async getCardNumbers(): Promise<MembershipCardDto[]> {
    return this.prisma.membershipCard.findMany({
      select: {
        number: true,
        member: {
          select: { id: true },
        },
      },
    });
  }

  async addMembershipCard(data: AddMembershipCardDto): Promise<HttpStatus.OK> {
    const member = await this.prisma.member.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        membershipCardNumber: true,
        email: true,
        firstName: true,
        memberSince: true,
        gender: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    } else if (member.membershipCardNumber) {
      throw new BadRequestException('Member already has a membership card');
    }

    const membershipCard = await this.prisma.membershipCard.findUnique({
      where: { number: data.membershipCardNumber },
      include: { member: true },
    });
    if (!membershipCard) {
      throw new NotFoundException('Membership card not found');
    } else if (membershipCard.member) {
      throw new BadRequestException('Membership card already assigned');
    }

    await this.prisma.member.update({
      where: { id: data.userId },
      data: {
        memberSince: new Date(),
        membershipCard: {
          connect: { number: data.membershipCardNumber },
        },
      },
      select: {
        membershipCardNumber: true,
      },
    });

    let pdfBuffer: Buffer;
    try {
      const _pdfBuffer = await this.membershipPdfService.generateMembershipPdf(
        member.id,
      ); // Uint8Array
      pdfBuffer = Buffer.from(_pdfBuffer);
    } catch (err) {
      this.logger.error(
        `Error generating membership card PDF for member ${member.id}:`,
      );
      this.logger.error(err);

      // remove membership card from member
      await this.prisma.member.update({
        where: { id: member.id },
        data: {
          membershipCard: {
            disconnect: true,
          },
          // keep original memberSince date (if any)
          memberSince: member.memberSince,
        },
      });

      throw new BadRequestException(
        'Error generating membership card PDF, membership card not assigned',
      );
    }

    this.mailService
      .sendEmail(
        { email: member.email, name: member.firstName },
        'Assegnazione tessera - Kinó Café',
        await readFile(
          join(process.cwd(), 'resources/emails/membership-card-assigned.ejs'),
          {
            encoding: 'utf-8',
          },
        ),
        {
          firstName: member.firstName,
          number: data.membershipCardNumber.toString(),
          downloadPdfUrl: `${this.config.get('FRONTEND_URL')}/v1/membership-pdf/${member.id}`,
          genderLetter: this.shared.getGenderSuffixItalian(member.gender),
        },
        [
          {
            ContentType: 'application/pdf',
            Filename: `membership-card-${member.membershipCardNumber}.pdf`,
            Base64Content: pdfBuffer.toString('base64'),
          },
        ],
      )
      .then(() => {
        this.logger.info(
          `Assigned membership card email sent to ${member.email}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `Error sending assigned membership card email to ${member.email}:`,
        );
        this.logger.error(error);
        console.log(error); // just to make sure it shows up in the logs
      });

    return HttpStatus.OK;
  }

  async getSignature(signatureR2Key: string) {
    return this.r2Service.downloadFileAsStream(signatureR2Key);
  }
}

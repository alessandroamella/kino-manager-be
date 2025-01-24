// admin/admin.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { I18nService } from 'nestjs-i18n';
import { MembershipCardDto } from './dto/MembershipCard.dto';
import { MemberDataDto } from 'member/dto/member-data.dto';
import { memberSelect } from 'member/member.select';
import { UpdateMemberDto } from 'member/update-member.dto';
import { VerificationMethod } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
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
      this.logger.warn('No members found to export.');
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
      this.logger.warn('No membership cards found to export.');
    }

    const workbook = new ExcelJS.Workbook();

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
        header: 'Data di Verifica',
        key: 'verificationDate',
        width: 30,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      { header: 'Metodo di Verifica', key: 'verificationMethod', width: 20 },
      {
        header: 'Data di Creazione',
        key: 'createdAt',
        width: 30,
        style: { numFmt: 'yyyy-mm-dd hh:mm:ss' },
      },
      { header: 'Numero di Telefono', key: 'phoneNumber', width: 20 },
      { header: 'Indirizzo', key: 'address', width: 60 },
      { header: 'Numero Documento', key: 'documentNumber', width: 20 },
      { header: 'Tipo Documento', key: 'documentType', width: 20 },
      {
        header: 'Scadenza Documento',
        key: 'documentExpiry',
        width: 30,
        style: { numFmt: 'yyyy-mm-dd' },
      },
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
        verificationDate: member.verificationDate,
        verificationMethod: member.verificationMethod,
        createdAt: member.createdAt,
        phoneNumber: member.phoneNumber,
        address: member.address,
        documentNumber: member.documentNumber,
        documentType: member.documentType
          ? this.i18n.t(`document.${member.documentType}`, {
              lang: 'it',
            })
          : null,
        documentExpiry: member.documentExpiry,
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
      'Excel file buffer generated successfully with Members and Tessere sheets.',
    );
    return excelBuffer as Buffer;
  }

  async getUsers(): Promise<MemberDataDto[]> {
    return this.prisma.member.findMany({
      select: memberSelect,
      orderBy: {
        createdAt: 'asc',
      },
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

  async updateUser(data: UpdateMemberDto) {
    const { id } = data;
    const existing = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!existing) {
      this.logger.debug(`User with ID ${id} not found in updateUser`);
      throw new NotFoundException('User not found');
    }
    const newMembershipCard =
      data.membershipCardNumber && !existing.membershipCardNumber
        ? data.membershipCardNumber
        : null;
    if (newMembershipCard) {
      const card = await this.prisma.membershipCard.findUnique({
        where: { number: data.membershipCardNumber },
        include: { member: true },
      });
      if (!card) {
        this.logger.debug(
          `Membership card with number ${data.membershipCardNumber} not found`,
        );
        throw new NotFoundException('Membership card not found');
      } else if (card.member) {
        this.logger.debug(
          `Membership card with number ${data.membershipCardNumber} already assigned`,
        );
        throw new BadRequestException('Card already assigned to another user');
      }

      this.logger.info(
        `Assigning membership card ${data.membershipCardNumber} to user with ID ${id}`,
      );
      // this means the card is new and can be assigned and user is verified
      data.verificationDate = new Date();
      data.verificationMethod = VerificationMethod.MANUAL;
    }

    delete data.membershipCardNumber; // Remove card number from update
    this.logger.debug(
      `Updating user with ID ${id} with data: ${JSON.stringify(data)}`,
    );
    return this.prisma.member.update({
      where: { id },
      data: {
        ...data,
        membershipCardNumber: newMembershipCard || undefined,
      },
      select: memberSelect,
    });
  }
}

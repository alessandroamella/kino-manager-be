// admin/admin.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async exportMembersToExcel(): Promise<Buffer> {
    this.logger.debug('Starting export of members to Excel');
    const members = await this.prisma.member.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        codiceFiscale: true,
        birthCountry: true,
        birthDate: true,
        isAdmin: true,
        birthComune: true,
        verificationDate: true,
        verificationMethod: true,
        createdAt: true,
        phoneNumber: true,
        address: true,
        documentNumber: true,
        documentType: true,
        documentExpiry: true,
        membershipNumber: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!members || members.length === 0) {
      this.logger.warn('No members found to export.');
      throw new Error('No members found to export.'); // Or handle empty export as needed
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Members');

    // Define headers in Italian
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nome', key: 'firstName', width: 20 },
      { header: 'Cognome', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Codice Fiscale', key: 'codiceFiscale', width: 30 },
      { header: 'Paese di Nascita', key: 'birthCountry', width: 20 },
      {
        header: 'Data di Nascita',
        key: 'birthDate',
        width: 15,
        style: { numFmt: 'yyyy-mm-dd' },
      },
      { header: 'Admin', key: 'Amministratore', width: 20 },
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
      { header: 'Numero di Tessera', key: 'membershipNumber', width: 20 },
    ];

    // Add rows from members data
    members.forEach((member) => {
      worksheet.addRow({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
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
        documentType: member.documentType,
        documentExpiry: member.documentExpiry,
        membershipNumber: member.membershipNumber,
      });
    });

    // Generate buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();
    this.logger.debug('Excel file buffer generated successfully.');
    return excelBuffer as Buffer;
  }

  async getUsers() {
    return this.prisma.member.findMany({
      // TODO refactor
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: false,
        codiceFiscale: true,
        birthDate: true,
        birthComune: true,
        birthCountry: true,
        phoneNumber: true,
        address: true,
        documentNumber: true,
        membershipNumber: true,
        documentType: true,
        documentExpiry: true,
        verificationMethod: true,
        verificationDate: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}

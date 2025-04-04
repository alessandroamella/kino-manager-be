import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { formatDate } from 'date-fns';
import { readFile } from 'fs/promises';
import parsePhoneNumber from 'libphonenumber-js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { I18nService } from 'nestjs-i18n';
import path from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { PrismaService } from 'prisma/prisma.service';
import { R2Service } from 'r2/r2.service';
import sharp from 'sharp';
import { Logger } from 'winston';
import { MembershipPdfDataDto } from './dto/membership-pdf-data.dto';

@Injectable()
export class MembershipPdfService {
  private static readonly ALMO_PDF_PATH = path.join(
    process.cwd(),
    'resources/forms/almo_modulo_RICHIESTA_ADESIONE.pdf',
  );

  constructor(
    private readonly i18n: I18nService,
    private readonly r2Service: R2Service,
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async generateMembershipPdf(
    userId: number,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    const member = await this.prisma.member.findUnique({
      where: {
        id: userId,
      },
    });
    if (!member || (!member.isAdmin && member.id !== userId)) {
      this.logger.debug(
        `Member not found or not authorized to generate PDF for member ${userId} (member: ${member ? `${member.firstName} ${member.lastName}` : 'not found'})`,
      );
      throw new BadRequestException(
        'Member not found or member data incomplete',
      );
    }

    const keys = [
      'birthComune',
      'streetName',
      'streetNumber',
      'postalCode',
      'city',
      'province',
      'country',
      'codiceFiscale',
      'birthProvince',
      'memberSince',
      'membershipCardNumber',
      'signatureR2Key',
    ];
    if (keys.some((e) => member[e] === null || member[e] === '')) {
      this.logger.debug(
        `Member data incomplete for member ${member.id}, cannot generate PDF`,
      );
      throw new BadRequestException(
        'Member data incomplete, cannot generate PDF',
      );
    }

    const data = member as MembershipPdfDataDto;

    const signatureWebpStream = await this.r2Service.downloadFile(
      data.signatureR2Key,
    );
    // load to sharp and convert to Uint8Arrays or ArrayBuffers png
    const chunks: Uint8Array[] = [];
    for await (const chunk of signatureWebpStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const signaturePngBuffer = await sharp(buffer).png().toBuffer();

    const pdfBytes = await readFile(MembershipPdfService.ALMO_PDF_PATH);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const signaturePng = await pdfDoc.embedPng(signaturePngBuffer);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const page = pages[0];

    page.drawText(data.membershipCardNumber.toString(), {
      x: 510,
      y: 764,
      size: 16,
      font: helveticaFont,
    });

    page.drawText(data.firstName, {
      x: 170,
      y: 550,
      size: 12,
      font: helveticaFont,
    });

    page.drawText(data.lastName, {
      x: 392,
      y: 550,
      size: 12,
      font: helveticaFont,
    });

    page.drawText(data.birthComune, {
      x: 122,
      y: 520,
      size: 12,
      font: helveticaFont,
    });
    page.drawText(data.birthProvince, {
      x: 380,
      y: 520,
      size: 12,
      font: helveticaFont,
    });
    page.drawText(`${formatDate(data.birthDate, 'dd    MM    yyyy')}`, {
      x: 488,
      y: 520,
      size: 12,
      font: helveticaFont,
    });

    data.codiceFiscale.split('').forEach((char, i) => {
      page.drawText(char, {
        x: Math.round(148 + i * 19.35),
        y: 491,
        size: 12,
        font: helveticaFont,
      });
    });

    page.drawText(data.streetName, {
      x: 167,
      y: 464,
      size: 12,
      font: helveticaFont,
    });
    page.drawText(data.streetNumber.toString(), {
      x: 530,
      y: 464,
      size: 12,
      font: helveticaFont,
    });

    page.drawText(data.postalCode, {
      x: 110,
      y: 434,
      size: 12,
      font: helveticaFont,
    });
    page.drawText(data.city, {
      x: 224,
      y: 434,
      size: data.city.length > 20 ? 11 : 12,
      font: helveticaFont,
    });
    page.drawText(data.province, {
      x: 412,
      y: 434,
      size: 12,
      font: helveticaFont,
    });
    page.drawText(this.i18n.t(`countries.${data.country}`, { lang: 'it' }), {
      x: 509,
      y: 434,
      size: 12,
      font: helveticaFont,
    });

    const parsedPhone = parsePhoneNumber(data.phoneNumber, 'IT');
    if (parsedPhone.isValid()) {
      page.drawText(parsedPhone.formatNational(), {
        x: 207,
        y: 406,
        size: 12,
        font: helveticaFont,
      });
    }

    page.drawText(data.email, {
      x: 110,
      y: 376,
      size: 12,
      font: helveticaFont,
    });

    // signature date
    page.drawText(formatDate(data.memberSince, 'dd    MM    yyyy'), {
      x: 136,
      y: 42,
      size: 12,
      font: helveticaFont,
    });

    // signature
    const pngDims = signaturePng.scale(0.3);
    page.drawImage(signaturePng, {
      x: 105,
      y: 72,
      width: pngDims.width,
      height: pngDims.height,
    });

    this.logger.debug('Data written to PDF');

    const savedPdf = await pdfDoc.save();
    return savedPdf;
  }
}

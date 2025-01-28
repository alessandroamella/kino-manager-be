import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { readFile } from 'fs/promises';
import path from 'path';
import { formatDate } from 'date-fns';
import { MembershipPdfDataDto } from './dto/membership-pdf-data.dto';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { I18nService } from 'nestjs-i18n';
import parsePhoneNumber from 'libphonenumber-js';

@Injectable()
export class MembershipPdfService {
  private static readonly ALMO_PDF_PATH = path.join(
    process.cwd(),
    'resources/forms/almo_modulo_RICHIESTA_ADESIONE.pdf',
  );
  private static readonly FONTS_DIR = path.join(
    process.cwd(),
    'resources/fonts',
  );

  constructor(
    private readonly i18n: I18nService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async generatePdf(data: MembershipPdfDataDto) {
    const pdfBytes = await readFile(MembershipPdfService.ALMO_PDF_PATH);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await readFile(
      path.join(MembershipPdfService.FONTS_DIR, 'MsMadi-Regular.ttf'),
    );
    this.logger.debug(`Font file read, byte length: ${fontBytes.length}`);

    const dancingScriptFont = await pdfDoc.embedFont(fontBytes);

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
      x: 227,
      y: 434,
      size: 12,
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
    page.drawText(`${data.firstName} ${data.lastName}`, {
      x: 105,
      y: 72,
      size: 24,
      font: dancingScriptFont,
    });

    this.logger.debug('Data written to PDF');

    const savedPdf = await pdfDoc.save();
    return savedPdf;
  }
}

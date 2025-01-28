import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from 'date-fns';
import { MembershipPdfDataDto } from './dto/membership-pdf-data.dto';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

@Injectable()
export class MembershipPdfService {
  private static readonly ALMO_PDF_PATH = path.join(
    process.cwd(),
    'resources/forms/almo_modulo_RICHIESTA_ADESIONE.pdf',
  );
  private static readonly SIGNED_TEMP_DIR = path.join(process.cwd(), 'temp');
  private static readonly FONTS_DIR = path.join(
    process.cwd(),
    'resources/fonts',
  );

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    setTimeout(() => {
      this.writeData({
        firstName: 'Alessandro',
        lastName: 'Amella',
        address:
          'Via della Cartiera, 16, 41018 San Cesario Sul Panaro MO, Italia',
        birthDate: new Date('2003-07-13T00:00:00.000Z'),
        birthComune: 'Modena',
        birthProvince: 'MO',
        membershipCardNumber: 1387,
        memberSince: new Date('2025-01-27T17:56:24.933Z'),
      });
    }, 500);
  }

  private GET_SIGNED_TEMP_PATH() {
    // add current date + randomize the file name to avoid conflicts
    return path.join(
      MembershipPdfService.SIGNED_TEMP_DIR,
      `/almo-signed-${Date.now()}-${uuidv4()}.pdf`,
    );
  }

  async writeData(data: MembershipPdfDataDto) {
    const pdfBytes = await readFile(MembershipPdfService.ALMO_PDF_PATH);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await readFile(
      path.join(MembershipPdfService.FONTS_DIR, 'MsMadi-Regular.ttf'),
    );
    this.logger.debug(`Font file read, byte length: ${fontBytes.length}`); // Add this line

    const dancingScriptFont = await pdfDoc.embedFont(fontBytes);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { width, height } = page.getSize();

    this.logger.debug(`PDF width: ${width}, height: ${height}`);

    page.drawText(formatDate(data.memberSince, 'dd    MM    yyyy'), {
      x: 136,
      y: 42,
      size: 12,
      font: helveticaFont,
    });

    page.drawText(`${data.firstName} ${data.lastName}`, {
      x: 105,
      y: 72,
      size: 24,
      font: dancingScriptFont,
    });

    this.logger.debug('Data written to PDF');

    const savedPdf = await pdfDoc.save();
    await writeFile(this.GET_SIGNED_TEMP_PATH(), savedPdf);

    this.logger.debug('PDF saved');
  }
}

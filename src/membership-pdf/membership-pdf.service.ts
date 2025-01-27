import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from 'date-fns';
import { MembershipPdfDataDto } from './dto/membership-pdf-data.dto';

@Injectable()
export class MembershipPdfService {
  private static readonly ALMO_PDF_PATH = path.join(
    process.cwd(),
    'resources/forms/almo_modulo_RICHIESTA_ADESIONE.pdf',
  );
  private static readonly SIGNED_TEMP_DIR = path.join(process.cwd(), 'temp');

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    // setTimeout(() => {
    //   this.writeData({
    //     signatureDate: new Date(),
    //   });
    // }, 1000);
  }

  private GET_SIGNED_TEMP_PATH() {
    // add current date + randomize the file name to avoid conflicts
    return path.join(
      MembershipPdfService.SIGNED_TEMP_DIR,
      `/almo-signed-${Date.now()}-${uuidv4()}.pdf`,
    );
  }

  async getAlmoPdf() {
    return readFile(MembershipPdfService.ALMO_PDF_PATH);
  }

  async writeData(data: MembershipPdfDataDto) {
    const pdfBytes = await this.getAlmoPdf();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const page = pages[0];

    const { width, height } = page.getSize();

    this.logger.debug(`PDF width: ${width}, height: ${height}`);

    page.drawText(formatDate(data.memberSince, 'dd    MM    yyyy'), {
      x: 135,
      y: 41,
      size: 12,
      font: helveticaFont,
    });

    const savedPdf = await pdfDoc.save();
    await writeFile(this.GET_SIGNED_TEMP_PATH(), savedPdf);
  }
}

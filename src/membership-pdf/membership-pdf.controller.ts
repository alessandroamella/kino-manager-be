import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { Response } from 'express';
import { MembershipPdfService } from './membership-pdf.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('membership-pdf')
export class MembershipPdfController {
  constructor(private readonly membershipPdfService: MembershipPdfService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Generate a filled membership PDF form',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({ description: 'PDF form', type: StreamableFile })
  async generateMembershipForm(
    @Res({ passthrough: true }) res: Response,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.membershipPdfService.generateMembershipPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=membership-form.pdf',
    );

    return new StreamableFile(pdfBuffer);
  }
}

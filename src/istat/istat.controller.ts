import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IstatService } from './istat.service';

@ApiTags('istat')
@Controller('istat')
export class IstatController {
  constructor(private readonly istatService: IstatService) {}

  @Get('comuni')
  @ApiOperation({ summary: 'Get Italian Comuni' })
  @ApiOkResponse({ description: 'Comuni', type: [String] })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  async getComuni(@Query('q') q?: string) {
    return this.istatService.getComuni(q);
  }
}

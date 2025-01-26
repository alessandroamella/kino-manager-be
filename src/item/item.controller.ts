import { UseGuards, Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { GetItemDto } from './dto/get-item.dto';
import { ItemService } from './item.service';

@ApiTags('item')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items' })
  @ApiOkResponse({ description: 'All items', type: [GetItemDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAllItems(): Promise<GetItemDto[]> {
    return this.itemService.findAll();
  }
}

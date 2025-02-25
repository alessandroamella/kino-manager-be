import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AdminGuard } from 'auth/admin.guard';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { ExpenseService } from './expense.service';
import { ExpenseDto } from './dto/expense.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { SetExpenseRepaidDto } from './dto/set-expense-repaid.dto';

@ApiTags('expense')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @ApiOperation({ summary: 'Get all expenses' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiOkResponse({ description: 'All expenses', type: [ExpenseDto] })
  @Get()
  async findAll(): Promise<ExpenseDto[]> {
    return this.expenseService.getExpenses();
  }

  @ApiOperation({ summary: 'Create expense' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiOkResponse({ description: 'Expense created', type: ExpenseDto })
  @Post()
  async create(@Body() data: CreateExpenseDto): Promise<ExpenseDto> {
    return this.expenseService.createExpense(data);
  }

  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'Expense ID' })
  @ApiOperation({ summary: 'Set expense as repaid or not' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiOkResponse({ description: 'Expense updated', type: ExpenseDto })
  @Patch('repaid/:id')
  async setRepaid(
    @Body() data: SetExpenseRepaidDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ExpenseDto> {
    return this.expenseService.setExpenseRepaid(id, data);
  }

  @Get('picture/:key')
  @ApiOperation({ summary: 'Get expense picture' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiNotFoundResponse({ description: 'Signature not found' })
  @ApiOkResponse({ description: 'User signature', type: StreamableFile })
  async getPicture(@Param('key') key: string) {
    const readable = await this.expenseService.getPicture(key);
    return new StreamableFile(readable, {
      type: 'image/webp',
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Admin role required',
  })
  @ApiNotFoundResponse({ description: 'Expense not found' })
  @ApiOkResponse({ description: 'Expense deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.expenseService.deleteExpense(id);
  }
}

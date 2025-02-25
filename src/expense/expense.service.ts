import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { expenseSelect } from './expense.select';
import { ExpenseDto } from './dto/expense.dto';
import { SetExpenseRepaidDto } from './dto/set-expense-repaid.dto';
import { R2Service } from 'r2/r2.service';
import { omit, padStart } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { formatDate } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly r2Service: R2Service,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getExpenses(): Promise<ExpenseDto[]> {
    this.logger.info('Fetching all expenses');
    return this.prisma.expense.findMany({
      select: expenseSelect,
    });
  }

  async createExpense(dto: CreateExpenseDto): Promise<ExpenseDto> {
    this.logger.info(
      `Creating expense: ${JSON.stringify(omit(dto, ['imageBase64']))}`,
    );

    let imageR2Key: string | null = null;

    if (dto.imageBase64) {
      const _imageR2Key = `${this.config.get(
        'R2_EXPENSES_FOLDER',
      )}/${formatDate(
        new Date(),
        'yyyy-MM-dd_HH-mm-ss',
      )}_${padStart(dto.userId.toString(), 4, '0')}_${uuidv4()}`;

      this.logger.debug(`Uploading expense image ${_imageR2Key}`);
      await this.r2Service.uploadFile({
        key: _imageR2Key,
        body: await this.r2Service.b64ImgToWebpBuffer(dto.imageBase64),
        contentType: 'image/webp',
      });

      imageR2Key = _imageR2Key;
    }

    const createData = {
      ...omit(dto, ['imageBase64']),
      imageR2Key,
    };

    return this.prisma.expense.create({
      data: createData,
      select: expenseSelect,
    });
  }

  async setExpenseRepaid(
    id: number,
    { repaid }: SetExpenseRepaidDto,
  ): Promise<ExpenseDto> {
    this.logger.info(`Setting expense ${id} repaid to ${repaid}`);
    return this.prisma.expense.update({
      where: { id },
      data: { repaid },
      select: expenseSelect,
    });
  }

  async getPicture(expenseR2Key: string) {
    return this.r2Service.downloadFileAsStream(expenseR2Key);
  }

  async deleteExpense(id: number): Promise<void> {
    this.logger.info(`Deleting expense ${id}`);

    // delete image from R2
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });
    if (!expense) {
      throw new BadRequestException('Expense not found');
    }

    if (expense.imageR2Key) {
      this.logger.debug(`Deleting expense image ${expense.imageR2Key}`);
      await this.r2Service.deleteFile(expense.imageR2Key);
    }

    await this.prisma.expense.delete({
      where: { id },
    });
  }
}

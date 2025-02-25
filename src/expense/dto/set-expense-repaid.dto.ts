import { PickType } from '@nestjs/swagger';
import { ExpenseDto } from './expense.dto';

export class SetExpenseRepaidDto extends PickType(ExpenseDto, ['repaid']) {}

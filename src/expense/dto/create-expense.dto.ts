import { ApiProperty, PickType } from '@nestjs/swagger';
import { ExpenseDto } from './expense.dto';
import { IsString } from 'class-validator';

export class CreateExpenseDto extends PickType(ExpenseDto, [
  'userId',
  'description',
  'amount',
  'repaid',
  'expenseDate',
]) {
  @ApiProperty({
    description: 'Base64 encoded image (e.g. of the receipt)',
  })
  @IsString()
  imageBase64: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expense } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';

export class ExpenseDto extends BaseDocumentDto implements Expense {
  @ApiProperty({
    description: 'User (admin) who made the expense',
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Description of the expense',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Amount of the expense',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Whether the expense has been repaid',
  })
  @IsBoolean()
  repaid: boolean;

  @ApiProperty({
    description: 'Date of the expense',
  })
  @Type(() => Date)
  @IsDate()
  expenseDate: Date;

  @ApiPropertyOptional({
    description: 'R2 file key of the image (e.g. of the receipt)',
  })
  @IsOptional()
  @IsString()
  imageR2Key: string | null;
}

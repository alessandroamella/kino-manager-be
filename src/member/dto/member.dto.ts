import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
  IsStrongPassword,
  Length,
  IsPhoneNumber,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Member, VerificationMethod } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { IsCodiceFiscale } from 'validators/is-codice-fiscale.decorator';
import parsePhoneNumber from 'libphonenumber-js';

export class MemberDto extends BaseDocumentDto implements Member {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  password: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @ApiProperty()
  @IsPhoneNumber('IT')
  @Transform(({ value }) => {
    return parsePhoneNumber(value, 'IT')!.formatInternational();
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Codice Fiscale, can be null if birthCountry != IT',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Length(16, 16)
  @IsCodiceFiscale()
  codiceFiscale: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsISO31661Alpha2()
  birthCountry: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  birthComune: string | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  birthDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  verificationDate: Date | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  memberSince: Date | null;

  @ApiPropertyOptional({ enum: VerificationMethod })
  @IsOptional()
  @IsEnum(VerificationMethod)
  verificationMethod: VerificationMethod | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  documentNumber: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  documentType: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  documentExpiry: Date | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  membershipCardNumber: number | null;

  @ApiProperty({ default: false })
  @IsBoolean()
  isAdmin: boolean;
}

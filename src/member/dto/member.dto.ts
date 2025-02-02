import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
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
  IsEnum,
  IsUrl,
} from 'class-validator';
import { Gender, Member } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { BaseDocumentDto } from 'prisma/dto/base-document.dto';
import { IsCodiceFiscale } from 'member/is-codice-fiscale.decorator';
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

  @ApiProperty({
    default: Gender.M,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @Transform(({ value }) => value.trim())
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  streetName: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  streetNumber: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  postalCode: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  province: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string | null;

  @ApiProperty()
  @IsISO31661Alpha2()
  birthCountry: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  birthProvince: string | null;

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
  memberSince: Date | null;

  @ApiProperty({
    description: 'URL of the signature image',
  })
  @IsUrl()
  signatureR2Key: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  membershipCardNumber: number | null;

  @ApiProperty({ default: false })
  @IsBoolean()
  isAdmin: boolean;

  @ApiPropertyOptional()
  @IsString()
  resetPwdJwt: string | null;
}

import { PickType } from '@nestjs/swagger';
import { SignupDto } from 'auth/dto/signup.dto';

export class AddSignatureDto extends PickType(SignupDto, ['signatureB64']) {}

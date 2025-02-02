import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AccessTokenDto } from './dto/access-token.dto';
import { ForgotPwdDto } from './dto/forgot-pwd.dto';
import { ResetPwdDto } from './dto/reset-pwd.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(200)
  @ApiOperation({ summary: 'Login' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ description: 'User logged in', type: AccessTokenDto })
  @Post('login')
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @HttpCode(201)
  @ApiOperation({ summary: 'Signup' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'User already exists' })
  @ApiCreatedResponse({ description: 'User created', type: AccessTokenDto })
  @Post('signup')
  async signup(@Body() data: SignupDto) {
    return this.authService.signup(data);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Forgot password' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ description: 'Password reset email sent' })
  @Post('forgot-password')
  async forgotPassword(@Body() data: ForgotPwdDto) {
    return this.authService.forgotPassword(data);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({
    description: 'Password reset successful',
    type: ForgotPwdDto,
  })
  @Post('reset-password')
  async resetPassword(@Body() data: ResetPwdDto) {
    return this.authService.resetPassword(data);
  }
}

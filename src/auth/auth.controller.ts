import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ schema: { properties: { username: { type: 'string' }, password: { type: 'string' } } } })
  login(@Body('username') username: string, @Body('password') password: string) {
    return this.authService.login(username, password);
  }
}

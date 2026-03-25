import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Usuario hardcodeado — cámbialo por uno seguro en producción
const ADMIN_USER = {
  username: 'admin',
  password: bcrypt.hashSync('admin123', 10),
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    if (username !== ADMIN_USER.username) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(password, ADMIN_USER.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const token = this.jwtService.sign({ username });
    return { access_token: token };
  }
}

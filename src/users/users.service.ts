import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.repo.find();
    return users.map(({ password: _, ...user }) => user);
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    const { password: _, ...result } = user;
    return result;
  }

  async create(username: string, password: string): Promise<Omit<User, 'password'>> {
    const existing = await this.repo.findOneBy({ username });
    if (existing) throw new ConflictException(`El usuario ${username} ya existe`);
    const hashed = await bcrypt.hash(password, 10);
    const user = this.repo.create({ username, password: hashed });
    const saved = await this.repo.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async update(id: number, username?: string, password?: string): Promise<Omit<User, 'password'>> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    const saved = await this.repo.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async remove(id: number): Promise<void> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    await this.repo.remove(user);
  }
}

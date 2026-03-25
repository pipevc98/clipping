import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiBody({ schema: { properties: { username: { type: 'string' }, password: { type: 'string' } } } })
  create(@Body('username') username: string, @Body('password') password: string) {
    return this.usersService.create(username, password);
  }

  @Patch(':id')
  @ApiBody({ schema: { properties: { username: { type: 'string' }, password: { type: 'string' } } } })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body('username') username?: string,
    @Body('password') password?: string,
  ) {
    return this.usersService.update(id, username, password);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}

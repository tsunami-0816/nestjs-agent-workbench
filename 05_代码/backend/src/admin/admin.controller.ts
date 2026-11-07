import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Get()
  findAll() {
    return this.userRepo.find({
      select: ['id', 'username', 'role', 'createdAt'],
      order: { id: 'ASC' },
    });
  }
}

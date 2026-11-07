import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
    private chatGateway: ChatGateway,
  ) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: parseInt(config.get('REDIS_PORT', '6379'), 10),
      password: config.get('REDIS_PASSWORD'),
      db: parseInt(config.get('REDIS_DB', '6'), 10),
    });
  }

  /** D-07: 注册 */
  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('用户名已存在');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ username: dto.username, passwordHash: hash, role: 'user' });
    await this.userRepo.save(user);
    return { id: user.id, username: user.username, role: user.role };
  }

  /** D-08: 登录，返回 JWT */
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');

    const jti = randomUUID();
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
      jti,
    });

    return {
      access_token: token,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  /** D-10: 登出，jti 加 Redis 黑名单 + 主动断开该用户所有 WS 连接 */
  async logout(userId: number, jti: string) {
    // 黑名单 EX 时间 = JWT 过期时间（2h = 7200s）
    await this.redis.set(`jwt:blacklist:${jti}`, '1', 'EX', 7200);
    // P1-2: 主动断开该用户所有 WebSocket 连接
    this.chatGateway.closeUserConnections(userId);
  }
}

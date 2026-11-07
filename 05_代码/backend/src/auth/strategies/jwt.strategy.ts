import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import Redis from 'ioredis';

export interface JwtPayload {
  sub: number;
  username: string;
  role: 'user' | 'admin';
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private redis: Redis;

  constructor(
    private config: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-me'),
    });
    // D-06: Redis 连接，用于 JWT 黑名单校验
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: parseInt(config.get('REDIS_PORT', '6379'), 10),
      password: config.get('REDIS_PASSWORD'),
      db: parseInt(config.get('REDIS_DB', '6'), 10),
    });
  }

  /**
   * JWT 校验后：1. 查 Redis 黑名单；2. 查用户是否存在
   * 成功返回的对象会挂到 req.user 上
   */
  async validate(payload: JwtPayload) {
    // 查黑名单：登出后 jti 被加入 Redis
    const blacklisted = await this.redis.get(`jwt:blacklist:${payload.jti}`);
    if (blacklisted) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return { id: user.id, username: user.username, role: user.role, jti: payload.jti };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Conversation } from './conversation.entity';

@Injectable()
export class ConversationService {
  private redis: Redis;

  constructor(
    @InjectRepository(Conversation)
    private convRepo: Repository<Conversation>,
    private config: ConfigService,
  ) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: parseInt(config.get('REDIS_PORT', '6379'), 10),
      password: config.get('REDIS_PASSWORD'),
      db: parseInt(config.get('REDIS_DB', '6'), 10),
    });
  }

  /** D-13: 查当前用户对话列表，Redis cache-aside */
  async findAll(userId: number) {
    const cacheKey = `conv:list:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const list = await this.convRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 10,
    });
    await this.redis.set(cacheKey, JSON.stringify(list), 'EX', 300);
    return list;
  }

  /** D-12: 创建新对话 */
  async create(userId: number, title?: string) {
    const conv = this.convRepo.create({
      userId,
      title: title || '新对话',
    });
    await this.convRepo.save(conv);
    // P2-2: 创建后失效缓存
    await this.redis.del(`conv:list:${userId}`);
    return conv;
  }

  /** 校验对话归属，不属当前用户抛 403 */
  async checkOwnership(convId: number, userId: number): Promise<Conversation> {
    const conv = await this.convRepo.findOne({ where: { id: convId } });
    if (!conv) throw new NotFoundException('对话不存在');
    if (conv.userId !== userId) throw new ForbiddenException('无权访问该对话');
    return conv;
  }

  /** 首条消息后自动改标题（P2-1） */
  async updateTitleToFirstMessage(convId: number, firstMessage: string) {
    await this.convRepo.update(convId, { title: firstMessage.slice(0, 20) });
  }

  /** 新消息后更新 updated_at + 失效缓存 */
  async touchAfterNewMessage(userId: number, convId: number) {
    await this.convRepo.update(convId, { updatedAt: new Date() });
    await this.redis.del(`conv:list:${userId}`);
  }
}

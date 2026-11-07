import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private msgRepo: Repository<Message>,
    private convService: ConversationService,
  ) {}

  /** D-14: 消息历史分页 */
  async findHistory(userId: number, convId: number, page: number, size: number) {
    // 校验对话归属
    await this.convService.checkOwnership(convId, userId);
    const [list, total] = await this.msgRepo.findAndCount({
      where: { conversationId: convId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    // 反转为时间正序返回
    return { list: list.reverse(), total, page, size };
  }

  /** 写消息 */
  async save(convId: number, role: 'user' | 'assistant', content: string) {
    const msg = this.msgRepo.create({ conversationId: convId, role, content });
    await this.msgRepo.save(msg);
    return msg;
  }

  /** 统计某对话下的消息条数（用于首条消息改标题判断） */
  async countByConversationId(convId: number): Promise<number> {
    return this.msgRepo.count({ where: { conversationId: convId } });
  }

  /** Q-007: 拉最近 N 条历史消息（时间正序），用于组装 LLM 多轮上下文 */
  async findRecentForContext(convId: number, limit = 10): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const rows = await this.msgRepo.find({
      where: { conversationId: convId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    // 反转为时间正序：旧消息在前，新消息在后
    return rows.reverse().map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  }
}

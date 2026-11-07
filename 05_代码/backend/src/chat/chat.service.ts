import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { MessageService } from '../message/message.service';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService');
  private openai: OpenAI;

  constructor(
    private config: ConfigService,
    private msgService: MessageService,
    private convService: ConversationService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('DEEPSEEK_API_KEY'),
      baseURL: this.config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
    });
  }

  /**
   * D-17/B-5: 调 DeepSeek 流式
   * @param onChunk 每收到一个 delta chunk 就回调
   * @param signal AbortSignal，断线时中断流
   *
   * P1-6: 流式失败兜底——user 消息已写库时，assistant 消息不能缺，
   *       否则 DB 留下「有问无答」的脏数据。失败时写一条 [生成失败] 占位，再 rethrow 让 gateway 推 error。
   */
  async streamChat(
    userId: number,
    convId: number,
    userContent: string,
    onChunk: (delta: string) => void,
    signal?: AbortSignal,
  ) {
    // Q-007: 先拉最近 10 条历史（在 save 本次 user 消息之前），组装多轮上下文
    // 注意：这里拉到的历史不含本次 user 消息，稍后再把本次 user 消息追加到 messages 末尾
    const history = await this.msgService.findRecentForContext(convId, 10);

    // D-20: 先把 user 消息写库
    const userMsg = await this.msgService.save(convId, 'user', userContent);

    // 首条消息自动改标题（P2-1）
    const msgCount = await this.msgService.countByConversationId(convId);
    if (msgCount <= 1) {
      await this.convService.updateTitleToFirstMessage(convId, userContent);
    }

    // D-17: 调 DeepSeek 流式（Q-007: messages 由 [历史..., 本次user] 组成，AI 能记上文）
    const llmMessages = [
      ...history,
      { role: 'user' as const, content: userContent },
    ];
    let fullContent = '';
    try {
      const stream = await this.openai.chat.completions.create(
        {
          model: this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat'),
          messages: llmMessages,
          stream: true,
        },
        { signal },
      );

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      }
    } catch (e: any) {
      this.logger.error(`LLM 流式失败: ${e.message}`);
      // P1-6: 写一条占位 assistant 消息，保证历史不残缺
      const fallback = `[生成失败] ${e.message || '未知错误'}`;
      await this.msgService.save(convId, 'assistant', fallback);
      await this.convService.touchAfterNewMessage(userId, convId);
      throw e; // 让 gateway 向前端推 error
    }

    // D-19: 流结束后写 assistant 消息
    const assistantMsg = await this.msgService.save(convId, 'assistant', fullContent);

    // 更新对话 updated_at + 失效缓存
    await this.convService.touchAfterNewMessage(userId, convId);

    return { userMsg, assistantMsg, fullContent };
  }
}

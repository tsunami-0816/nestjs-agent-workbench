import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { WebSocket as WsWebSocket } from 'ws';
import { ChatService } from './chat.service';
import { ConversationService } from '../conversation/conversation.service';

type AuthedClient = WsWebSocket & { userId?: number };

@WebSocketGateway({ path: '/ws' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('ChatGateway');
  @WebSocketServer() server: any;

  /** userId → 该用户所有 WS 连接 */
  private userConnections = new Map<number, Set<AuthedClient>>();
  /** WS 连接 → 该连接上活跃的 AbortController */
  private activeStreams = new Map<AuthedClient, Set<AbortController>>();
  private redis: Redis;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private chatService: ChatService,
    private convService: ConversationService,
  ) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: parseInt(config.get('REDIS_PORT', '6379'), 10),
      password: config.get('REDIS_PASSWORD'),
      db: parseInt(config.get('REDIS_DB', '6'), 10),
    });
  }

  /** D-15: 连接时 JWT 鉴权 */
  async handleConnection(client: AuthedClient, request: any) {
    try {
      const url = new URL(request.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) {
        client.close(4001, '未提供 token');
        return;
      }

      const payload: any = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET', 'change-me'),
      });

      const blacklisted = await this.redis.get(`jwt:blacklist:${payload.jti}`);
      if (blacklisted) {
        client.close(4001, 'token 已失效');
        return;
      }

      client.userId = payload.sub;
      if (!this.userConnections.has(payload.sub)) {
        this.userConnections.set(payload.sub, new Set());
      }
      this.userConnections.get(payload.sub)!.add(client);
      this.logger.log(`用户 ${payload.sub} WS 连接成功`);

      client.on('message', async (data: Buffer) => {
        await this.handleMessage(client, data.toString());
      });
    } catch (e: any) {
      this.logger.error(`WS 连接鉴权失败: ${e.message}`);
      try { client.close(4001, 'token 无效'); } catch {}
    }
  }

  /** D-16: 接收 chat 消息事件 */
  async handleMessage(client: AuthedClient, raw: string) {
    const userId = client.userId!;
    let ac: AbortController | null = null;
    let msg: { type: string; conversationId: number; content: string };
    try {
      msg = JSON.parse(raw);
    } catch {
      client.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
      return;
    }

    if (msg.type !== 'chat') return;

    // P1-5: WS 通道入参校验（HTTP ValidationPipe 管不到这里）
    const convId = Number(msg.conversationId);
    const content = typeof msg.content === 'string' ? msg.content.trim() : '';
    if (!Number.isFinite(convId) || convId <= 0) {
      client.send(JSON.stringify({ type: 'error', message: 'conversationId 非法' }));
      return;
    }
    if (!content) {
      client.send(JSON.stringify({ type: 'error', message: '消息内容不能为空' }));
      return;
    }
    if (content.length > 4000) {
      client.send(JSON.stringify({ type: 'error', message: '消息最长 4000 字' }));
      return;
    }

    try {
      await this.convService.checkOwnership(convId, userId);

      ac = new AbortController();
      if (!this.activeStreams.has(client)) {
        this.activeStreams.set(client, new Set());
      }
      this.activeStreams.get(client)!.add(ac);

      await this.chatService.streamChat(
        userId,
        convId,
        content,
        (delta) => {
          client.send(JSON.stringify({
            type: 'chunk',
            conversationId: convId,
            content: delta,
          }));
        },
        ac.signal,
      );

      client.send(JSON.stringify({
        type: 'done',
        conversationId: convId,
      }));
    } catch (e: any) {
      this.logger.error(`chat 处理失败: ${e.message}`);
      client.send(JSON.stringify({ type: 'error', conversationId: convId, message: e.message }));
    } finally {
      if (ac) this.activeStreams.get(client)?.delete(ac);
    }
  }

  /** B-8: 断线时 abort 所有活跃流 */
  handleDisconnect(client: AuthedClient) {
    const userId = client.userId;
    if (userId && this.userConnections.has(userId)) {
      this.userConnections.get(userId)!.delete(client);
    }
    const streams = this.activeStreams.get(client);
    if (streams) {
      streams.forEach((a) => a.abort());
      this.activeStreams.delete(client);
    }
    this.logger.log(`用户 ${userId} WS 断开`);
  }

  /** P1-2: 登出时主动断开该用户所有 WS */
  closeUserConnections(userId: number) {
    const conns = this.userConnections.get(userId);
    if (conns) {
      conns.forEach((ws) => ws.close(4001, 'logged out'));
      this.userConnections.delete(userId);
    }
  }
}

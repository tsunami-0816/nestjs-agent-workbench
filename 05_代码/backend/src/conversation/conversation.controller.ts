import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('conversations')
export class ConversationController {
  constructor(private convService: ConversationService) {}

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.convService.findAll(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: number, @Body() body: { title?: string }) {
    return this.convService.create(userId, body?.title);
  }

  // D-14: 消息历史分页在 MessageController 里
}

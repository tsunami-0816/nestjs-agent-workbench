import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { MessageService } from './message.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('conversations/:id/messages')
export class MessageController {
  constructor(private msgService: MessageService) {}

  @Get()
  findHistory(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) convId: number,
    @Query('page') page = '1',
    @Query('size') size = '20',
  ) {
    return this.msgService.findHistory(userId, convId, parseInt(page, 10), parseInt(size, 10));
  }
}

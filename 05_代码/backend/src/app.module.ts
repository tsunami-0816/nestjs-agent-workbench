import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { User } from './users/user.entity';
import { Conversation } from './conversation/conversation.entity';
import { Message } from './message/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('DB_HOST', 'localhost'),
        port: parseInt(cfg.get('DB_PORT', '3310'), 10),
        username: cfg.get('DB_USER', 'root'),
        password: cfg.get('DB_PASS', 'root123'),
        database: cfg.get('DB_NAME', 'nestjs_workbench'),
        entities: [User, Conversation, Message],
        synchronize: true,
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    ConversationModule,
    MessageModule,
    ChatModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    // D-09: 全局注册 JWT Guard，@Public() 装饰的路由豁免
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

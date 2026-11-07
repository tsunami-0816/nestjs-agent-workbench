import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 指定用 ws 原生库而非 socket.io
  app.useWebSocketAdapter(new WsAdapter(app));

  // P1-1: CORS 配置，允许前端 Vite dev server 跨域
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5183';
  app.enableCors({ origin: corsOrigin.split(','), credentials: true });

  // 全局异常过滤器（D-02）
  app.useGlobalFilters(new AllExceptionsFilter());
  // 全局响应拦截器（D-03）
  app.useGlobalInterceptors(new TransformInterceptor());
  // 全局 DTO 校验 Pipe（D-23）
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = parseInt(process.env.PORT || '8089', 10);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}
bootstrap();

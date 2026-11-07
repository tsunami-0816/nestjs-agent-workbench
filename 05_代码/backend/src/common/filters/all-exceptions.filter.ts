import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * D-02: 全局异常过滤器
 * 把所有异常统一返回 { code, message, traceId } JSON 格式，不暴露 NestJS 默认 HTML 错误页
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const traceId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const m = (res as any).message;
        message = Array.isArray(m) ? m.join('; ') : String(m);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`[${traceId}] ${exception.stack}`);
    }

    response.status(status).json({
      code: status,
      message,
      traceId,
    });
  }
}

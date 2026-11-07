import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

/**
 * D-11: Admin 角色守卫，加在 /admin/* 路由上
 * 前置：JwtAuthGuard 已经跑过，req.user 已存在
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('需要 admin 角色');
    }
    return true;
  }
}

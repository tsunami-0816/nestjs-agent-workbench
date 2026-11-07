import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** 标记公开路由，跳过 JWT Guard */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

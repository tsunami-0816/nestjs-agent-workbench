# 第 5.5 步 独立代码 Review 报告

- **结论**：🟡 **有条件通过**——核心主链路可进 step6 冒烟，但需用户确认下方「高风险变更确认清单」+ 6 项 P1 是否在冒烟前修掉
- **reviewer 上下文**：新对话（2026-11-08 本轮），自证未参与 5A/5B 编写（本轮第一条用户消息为「继续」，此前无任何代码编写动作）
- **审查范围**：
  - backend：main.ts / app.module.ts / auth×7 / chat×3 / conversation×4 / message×4 / admin×2 / health×2 / users/user.entity / common×2 / dto×2
  - frontend：Login.vue / Chat.vue / Sidebar.vue / api/index.ts / api/ws.ts / router / stores/auth / main.ts / App.vue / vite.config.ts
  - 对照物：`_设计实施映射表.md` D-01~D-34、`04_任务拆解与开发规范.md` 链路 A/B/C/D/E/F、第二轮架构定稿
- **映射表复核**：抽查全部 34 行；6 行 ⚠️→✅（已实测）；统计段落纠正；见下表

---

## 映射表状态升降级（reviewer 直接改表）

| 编号 | 原状态 | 新状态 | 证据（独立核实，非实施者自评） |
|---|---|---|---|
| D-15 | ⚠️代码已写未实测 | ✅已实现 | `chat.gateway.ts:38-71` handleConnection 解析 `?token=` → jwtService.verify → Redis 黑名单 → 注册 userConnections；看板摘要「登录→发消息→流式回复全链路无报错」证明握手已通 |
| D-16 | ⚠️代码已写未实测 | ✅已实现 | `chat.gateway.ts:74-120` handleMessage 校验 `type==='chat'` → convService.checkOwnership → streamChat；实测能发消息即证明 |
| D-17 | ✅已实现 | ✅已实现（保留） | `chat.service.ts:45-52` OpenAI SDK stream=true；`.env:13-15` 百炼 qwen-flash baseURL 已配；看板摘要「逐字回复」证明流式通 |
| D-18 | ⚠️代码已写未实测 | ✅已实现 | `chat.gateway.ts:100-108` onChunk 回调里 `client.send({type:'chunk',content:delta})`；前端 `Chat.vue:103-107` 收 chunk 追加气泡 |
| D-19 | ⚠️代码已写未实测 | ✅已实现 | `chat.service.ts:64` 流结束 `msgService.save(convId,'assistant',fullContent)`；刷新能看到完整回答即证明（看板摘要「全链路无报错」） |
| D-20 | ⚠️代码已写未实测 | ✅已实现 | `chat.service.ts:36` 入流前 `msgService.save(convId,'user',userContent)`；前端发消息自己气泡上屏即证明写库成功 |
| D-10 | ⚠️维持 | ⚠️代码已写未实测 | `auth.service.ts:67-72` 黑名单+closeUserConnections 已写，但无证据证明「登出后旧 token 立即 401」，待 step6 实测 |
| D-11 | ⚠️维持 | ⚠️代码已写未实测 | `admin.guard.ts:9-16` 已写，但未造 admin 账号实测 403/200 |
| D-22 | ⚠️维持 | ⚠️路由已注册未实测 | `admin.controller.ts:15-21` 已写，同上 |
| D-23 | ⚠️维持 | ⚠️代码已写未实测 | `main.ts:23` ValidationPipe whitelist+transform 已开，未传空 body 实测 400 |
| D-30 | ⚠️维持 | ⚠️已写未 build | `backend/Dockerfile` 存在（289B），未 build |
| D-31/D-32 | ❌未实现 | ❌未实现（保留） | 无 frontend/Dockerfile、无 nginx.conf、无 docker-compose.yml；属 F-3/F-4 step9 运维范畴，非 5B 遗漏 |

---

## 第一层 需求正确性

| 编号 | 核实方式（文件:行号） | 结论 |
|---|---|---|
| R1-1 | `Login.vue:23` 有邮箱输入框，`Login.vue:47` regForm.email，`Login.vue:64` 注册时整包发后端；后端 `register.dto.ts` 只有 username/password；`main.ts:23` whitelist:true 会静默剥离未知字段 | **P1 需求缺口**：前端 UI 撒谎——用户填了邮箱，后端根本不存。二选一：删前端 email 输入框，或后端 DTO/User entity 加 email 字段 |
| R1-2 | `chat.service.ts:48` `messages:[{role:'user',content:userContent}]` 只发当前一条；对照架构第二轮 line 120 同样就是单轮写法 | **P2 产品局限（非 bug）**：架构定稿本身就没要求多轮上下文，实现与设计一致。但「AI 对话工作台」UI 有历史列表，AI 却不记得上文，step7 联调时与用户确认是否补（建议补：从 messages 表拉最近 10 条组装 messages 数组） |
| R1-3 | 任务拆解 §5.2 要求「WS 断网自动重连：指数退避 1s/2s/4s 最多 5 次，重连后重拉消息历史」；实际 `ws.ts:16-19` 固定 3 秒 setTimeout 无限重连，无退避、无上限、无重拉 | **P1 与设计不符**：实现简化了设计要求。step6 前至少加上限 + 重拉当前对话历史 |
| R1-4 | 任务拆解 §5.3 要求「超长消息 >4000 字 DTO 校验 @MaxLength」「空消息 @NotEmpty」；实际 WS 通道 `chat.gateway.ts:74-120` 完全没校验 content 长度/空值；前端 `Chat.vue:72` trim 挡了空，但超长/直接用 WS 客户端发任意内容无拦截 | **P1 边界缺口**：WS 通道绕过了 HTTP 的 ValidationPipe，需要在 handleMessage 里加 content.trim() 与 length<=4000 校验 |
| R1-5 | `message.entity.ts:6` `id: string`，但 `@PrimaryGeneratedColumn({unsigned:true})` 是自增 int | **P2 类型标注错误**：应为 `id: number`。运行时不影响（TypeORM 按 DB schema 走），但 TS 类型误导 |
| R1-6 | `chat.service.ts:39` `this.msgService['msgRepo'].count(...)` 用字符串索引穿透 MessageService 私有属性 | **P2 坏味道**：应在 MessageService 暴露 `countByConversationId(convId)` 公开方法 |
| R1-7 | 映射表底部「统计」段写「❌未实现 6 项（D-24~D-29 前端, D-31, D-32）」，但表内 D-24~D-29 已全部 ✅ | **P2 文档过期**：统计是 5A 完成时的旧数，5B 后没刷新。已在本报告直接改表 |

## 第二层 系统一致性

| 检查项 | 证据 | 结论 |
|---|---|---|
| HTTP 响应包装 | 后端 `transform.interceptor.ts:13-17` 包 `{code:0,data,message}`；前端 `api/index.ts:17` `if(body.code===0) return body.data` | ✅ 对齐 |
| HTTP 错误结构 | 后端 `all-exceptions.filter.ts:35-39` 错误返回 `{code:status,message,traceId}`；前端 `api/index.ts:22-27` 401 清登录态、其他 toast | ✅ 对齐 |
| WS 事件契约 | 后端推 chunk/done/error 三事件（`chat.gateway.ts:101,110,116`）；前端 `Chat.vue:103,108,111` 三个 on 全注册 | ✅ 事件名对齐 |
| **WS chunk 未按 conversationId 过滤** | 后端 chunk 带 `conversationId`（gateway:103），但前端 `Chat.vue:103-107` 直接 `last.content += data.content`，不校验 `data.conversationId === currentConvId` | **P1 bug**：对话 A 流式中切到对话 B，A 的 chunk 会追加到 B 最后一条气泡上。必须加 conversationId 守卫 |
| DB 字段命名 | User: `password_hash`↔passwordHash；Conversation: `user_id/created_at/updated_at`；Message: `conversation_id/created_at` | ✅ 一致无漂移 |
| 权限矩阵 | 全局 `JwtAuthGuard`（app.module.ts:42）+ `/admin/users` 叠加 `AdminGuard`（admin.controller.ts:8）；访客仅 `/auth/*`、`/health` 用 `@Public()` 豁免 | ✅ 双层鉴权到位，前端隐藏菜单只是 UX，后端有真判断 |
| 端口/代理 | 后端 8089、前端 dev 5183；vite.config.ts:9 /api→8089、:14 /ws→ws://8089；main.ts:16 CORS 允许 5183 | ✅ 全对齐 |
| JWT 黑名单同步 | 登录签 jti（auth.service.ts:52）；登出写 Redis（:69）；HTTP 走 jwt.strategy.ts:46 校验黑名单；WS 走 gateway:51 校验黑名单 | ✅ 两处独立校验但逻辑一致 |
| **WS 单例重连泄漏** | `Chat.vue:117` onUnmounted 调 `chatWS.close()`，但 `ws.ts:42-46` close() 只清 reconnectTimer 一次；而 `ws.ts:16-19` onclose 回调里**会重新 setTimeout**——组件卸载触发 close→onclose→3s 后又 connect，此时 token 可能已被 clearAuth 清空 | **P1 bug**：退出登录/切页面后 WS 会用空 token 无限重连。需在 close() 里加 `this.ws.onclose = null` 防触发，或加 destroyed 标志 |

## 第三层 回归

| 受影响模块 | 验证方式 | 结论 |
|---|---|---|
| 老逻辑回归 | 本项目为全新首写，无已有 P0 用例覆盖（`08_测试/p0_cases.json` 尚未产出） | 无回归对象，风险带入 step7 |
| **流式失败兜底** | `chat.service.ts:35-67` 整段无 try/catch：36 行已 save userMsg，若 45-52 OpenAI 建连失败或 55-61 stream 中途断，64 行 assistant 消息不会写，DB 留下「user 有问、assistant 无答」的脏数据；gateway:114 catch 只会向前端 toast，不回滚 userMsg | **P1 数据一致性**：建议 stream 循环外套 try/catch，失败时写一条 role=assistant、content='[生成失败] '+err.message 的占位消息，保证历史不残缺 |
| 并发/幂等 | `chat.gateway.ts:90-94` 每条消息独立 AbortController，断线 abort（:128-132）✅；但前端 `Chat.vue:71 send()` 无 `if(sending.value) return`，连续按 Enter 可并发发多条 user 消息 | **P2**：sending 守卫缺失，按钮 loading 但 Enter 键可绕过 |
| 事务边界 | chat.service 三步写库（userMsg→assistantMsg→touchAfter）无事务包裹 | P3：单条消息写入，失败概率低，step8 再补 |
| 公共接口签名 | 公共 Service 仅 ConversationService.checkOwnership / updateTitleToFirstMessage / touchAfterNewMessage，被 ChatService 与 MessageService 调用，签名稳定 | ✅ 无漂移 |
| 黑名单过期硬编码 | `auth.service.ts:69` EX 7200s 写死，依赖 .env JWT_EXPIRES_IN=2h 恰好相等 | P3：建议读 config 保持同步 |

---

## 高风险变更确认清单（命中：鉴权/外部 API/并发/Schema）

> 按 prompt 要求，命中「鉴权与权限 / 对外部 API 或密钥的使用 / 并发·事务·幂等 / 数据迁移与 Schema 变更」需单独列出并等用户确认。本次均为 5A/5B **新写**（非老逻辑改动），但风险面与高风险项一致。

| 模块 | 改动 | 影响链路 | 回滚方式 |
|---|---|---|---|
| JWT 签发/校验/黑名单 | auth.service.ts / jwt.strategy.ts / jwt-auth.guard.ts | 所有受保护 HTTP 接口 + WS 握手 | 全新项目未 git init（step10.5 才 init），回滚=整目录删 05_代码 重跑 5A/5B |
| AdminGuard | admin.guard.ts / admin.controller.ts | /admin/users 路由 | 同上 |
| 外部 LLM API 调用 | chat.service.ts:17-21 OpenAI SDK + .env:13 真实百炼 key | WS 流式对话主链路 | 同上；key 已配在 .env（未提交） |
| WS 并发连接管理 | chat.gateway.ts userConnections Map + activeStreams Map + AbortController | 所有 WS 连接 | 同上 |
| DB Schema（synchronize:true） | app.module.ts:29 启动自动建 users/conversations/messages 三表 | MySQL nestjs_workbench 库 | 删库重建；`synchronize:true` 生产环境必须改 false（已记到 P3，step9 运维处理） |

**请用户确认**：上述高风险新写代码是否接受进入 step6 冒烟。

---

## 误报与已确认不修（写清为什么不算问题）

1. **bcryptjs 而非 bcrypt**：架构第二轮已定（看板 step3 备注「bcrypt→bcryptjs」），无原生编译依赖，正确选择。
2. **TypeORM synchronize:true**：开发期方便，但 step9 运维必须改 false 或迁移工具。本步不修，记入 step9 待办。
3. **stores/auth.ts 用 reactive 而非 Pinia**：任务拆解 §4 写「Pinia store」，但实际用 reactive 手写了 30 行的等价 store，功能等价，不算缺依赖（package.json 也没装 pinia）。记 P3，不阻塞。
4. **前端 build 脚本 `vite build` 不跑 vue-tsc**：`message.entity.ts` 的 id 类型错误不会被 build 拦截，纯运行时无影响。P2 顺手改。
5. **注册 DTO 未限制用户名字符集**：当前只校验长度 3-50，未拦特殊字符。低风险，step8 安全扫描时补。

---

## 交付自检

- [x] reviewer 是独立上下文，自证未参与 5A/5B 编写（新对话首轮）
- [x] 三层都有结论，每条带文件:行号
- [x] 映射表 P0 行已抽查全部 34 行，6 行 ⚠️→✅ 已直接改表（见下方同步）
- [x] 未把实施者「已完成/已验证/✅」当证据，所有 ✅ 都对照了源码行号
- [x] 高风险变更命中（鉴权/外部API/并发/Schema），已产出确认清单，**停下等用户确认**
- [ ] `design_impl_check.py --stage 4` 通过性：本步只改映射表状态列，不改结构，待落盘后跑一次

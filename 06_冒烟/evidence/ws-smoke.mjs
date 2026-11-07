// WS 流式冒烟客户端
// 用法：node ws-smoke.mjs <token> <convId>
import WebSocket from 'ws';

const token = process.argv[2];
const convId = Number(process.argv[3]);
const msg = '用一句话介绍你自己';

const ws = new WebSocket(`ws://localhost:8089/ws?token=${token}`);
let chunks = [];
let done = false;
let errored = null;

ws.on('open', () => {
  console.log('[open] connected');
  ws.send(JSON.stringify({ type: 'chat', conversationId: convId, content: msg }));
});

ws.on('message', (data) => {
  const m = JSON.parse(data.toString());
  if (m.type === 'chunk') {
    chunks.push(m.content);
    process.stdout.write(m.content);
  } else if (m.type === 'done') {
    done = true;
    console.log('\n[done] conversationId=' + m.conversationId);
    ws.close();
  } else if (m.type === 'error') {
    errored = m;
    console.log('\n[error]', m);
    ws.close();
  }
});

ws.on('error', (e) => {
  console.log('[ws-error]', e.message);
});

setTimeout(() => {
  console.log('\n--- summary ---');
  console.log('chunks received:', chunks.length);
  console.log('full content:', chunks.join('').slice(0, 200));
  console.log('done:', done);
  console.log('errored:', errored);
  process.exit(done ? 0 : 1);
}, 20000);

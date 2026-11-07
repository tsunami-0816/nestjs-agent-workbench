import WebSocket from "ws";
const token = process.argv[2];
const convId = process.argv[3];
const ws = new WebSocket(`ws://localhost:8089/ws?token=${token}`);
let buf = "";
let step = 0;
const steps = [
  { type: "chat", conversationId: Number(convId), content: "我叫小明，今年28岁，记住这个名字。" },
  { type: "chat", conversationId: Number(convId), content: "我刚才说我叫什么名字？多少岁？只回答名字和年龄，不要解释。" },
];
ws.on("open", () => {
  console.log("[open]");
  const next = () => {
    if (step >= steps.length) { setTimeout(() => ws.close(), 1500); return; }
    buf = "";
    ws.send(JSON.stringify(steps[step]));
  };
  next();
});
ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === "chunk") { buf += msg.content; }
  else if (msg.type === "done") {
    console.log(`[step ${step+1} done] answer: ${buf}`);
    step++;
    setTimeout(next, 800);
  } else if (msg.type === "error") {
    console.log("[error]", msg.message);
    step++;
    setTimeout(next, 800);
  }
});
ws.on("close", () => { console.log("[closed]"); process.exit(0); });
ws.on("error", (e) => { console.log("[ws err]", e.message); process.exit(1); });
import json, sys, time, urllib.request
import websocket

# login
req = urllib.request.Request("http://localhost:8089/auth/login",
    data=json.dumps({"username":"smokeuser","password":"smoke1234"}).encode(),
    headers={"Content-Type":"application/json"})
login = json.loads(urllib.request.urlopen(req).read())
token = login["data"]["access_token"]

# create conv
req = urllib.request.Request("http://localhost:8089/conversations",
    data=json.dumps({"title":"多轮py"}).encode(),
    headers={"Content-Type":"application/json","Authorization":f"Bearer {token}"},
    method="POST")
conv = json.loads(urllib.request.urlopen(req).read())
conv_id = conv["data"]["id"]
print(f"conv_id={conv_id}")

ws = websocket.create_connection(f"ws://localhost:8089/ws?token={token}", timeout=60)
print("[open]")

def send_step(content):
    ws.send(json.dumps({"type":"chat","conversationId":conv_id,"content":content}))
    buf = ""
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("type") == "chunk":
            buf += msg.get("content","")
        elif msg.get("type") == "done":
            print(f"[answer] {buf}")
            return buf
        elif msg.get("type") == "error":
            print(f"[error] {msg}")
            return ""

send_step("我叫小红，今年26岁，是一名前端工程师。记住这些信息。")
time.sleep(1)
send_step("我刚才说我叫什么名字？多少岁？做什么工作？只回答这三个事实，不要解释。")
ws.close()
print("[closed]")
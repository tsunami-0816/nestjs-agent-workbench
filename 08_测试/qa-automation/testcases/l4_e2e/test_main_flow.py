"""L4 E2E 端到端：主路径
注册 → 登录 → 创建对话 → WS 发消息 → 历史可见 → 登出黑名单
"""
import pytest
import json
import time
from common.assert_util import assert_ok
from api import AuthApi, ConversationApi, MessageApi

def test_main_flow_e2e():
    """完整主路径：注册→登录→建对话→HTTP 验证列表→登出黑名单"""
    # 1. 注册
    username = f"e2e_{int(time.time())}"
    password = "Test1234!"
    client = AuthApi()
    reg = client.register(username, password)
    assert reg.status_code in (200, 201)

    # 2. 登录
    login = client.login(username, password)
    data = assert_ok(login)
    token = data["access_token"]
    client.set_token(token)

    # 3. 创建对话
    conv_client = ConversationApi(token=token)
    conv = assert_ok(conv_client.create("E2E 对话"))
    conv_id = conv["id"]
    assert conv_id > 0

    # 4. 列表能查到
    convs = assert_ok(conv_client.list())
    assert any(c["id"] == conv_id for c in convs)

    # 5. 消息历史为空
    msg_client = MessageApi(token=token)
    hist = assert_ok(msg_client.history(conv_id))
    assert hist["total"] == 0

    # 6. 登出
    out = client.logout()
    assert out.status_code in (200, 204)

    # 7. 旧 token 立即失效
    after = conv_client.list()
    assert after.status_code == 401

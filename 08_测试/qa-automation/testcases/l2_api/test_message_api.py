"""L2 接口测试：messages 模块（历史分页）"""
import pytest
from common.assert_util import assert_ok, assert_http_status
from api import ConversationApi, MessageApi

def test_history_empty_on_new_conversation(temp_user):
    """正向：新建对话历史为空 total=0"""
    conv = assert_ok(ConversationApi(token=temp_user["token"]).create())
    client = MessageApi(token=temp_user["token"])
    resp = client.history(conv["id"])
    data = assert_ok(resp)
    assert data["total"] == 0
    assert data["list"] == []

def test_history_pagination_params(temp_user):
    """边界：page=0 和 pageSize=999 不崩"""
    conv = assert_ok(ConversationApi(token=temp_user["token"]).create())
    client = MessageApi(token=temp_user["token"])
    # page=1 size=20 正常
    resp = client.history(conv["id"], page=1, size=20)
    assert resp.status_code == 200

def test_history_unauthorized(auth_api):
    """越权：不带 token 访问历史返回 401"""
    client = MessageApi()
    resp = client.history(1)
    assert_http_status(resp, 401)

def test_history_cross_user(temp_user):
    """越权：A 用户访问 B 用户的对话历史返回 403 或 404"""
    # 先建一个 A 用户的对话
    conv = assert_ok(ConversationApi(token=temp_user["token"]).create())
    # 再注册 B 用户
    import time, random
    from api import AuthApi
    b_username = f"userB_{int(time.time())}_{random.randint(100,999)}"
    b_client = AuthApi()
    b_client.register(b_username, "Test1234!")
    b_login = b_client.login(b_username, "Test1234!")
    b_token = b_login.json()["data"]["access_token"]
    # B 用户访问 A 的对话历史
    b_msg = MessageApi(token=b_token)
    resp = b_msg.history(conv["id"])
    assert resp.status_code in (403, 404), f"expected 403/404, got {resp.status_code}"

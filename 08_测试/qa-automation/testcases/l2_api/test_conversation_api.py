"""L2 接口测试：conversations 模块（列表/创建）"""
import pytest
from common.assert_util import assert_ok, assert_http_status
from api import ConversationApi

def test_list_conversations_empty(temp_user):
    """正向：新用户对话列表为空数组"""
    client = ConversationApi(token=temp_user["token"])
    resp = client.list()
    data = assert_ok(resp)
    assert isinstance(data, list)

def test_create_conversation_success(temp_user):
    """正向：创建对话返回 id"""
    client = ConversationApi(token=temp_user["token"])
    resp = client.create("测试对话")
    data = assert_ok(resp)
    assert data["id"] > 0
    assert data["title"] == "测试对话"

def test_create_conversation_no_title(temp_user):
    """边界：不传 title 也能创建（默认'新对话'）"""
    client = ConversationApi(token=temp_user["token"])
    resp = client.create()
    data = assert_ok(resp)
    assert data["id"] > 0

def test_list_after_create(temp_user):
    """正向：创建后列表立即可见（Redis 缓存失效）"""
    client = ConversationApi(token=temp_user["token"])
    created = assert_ok(client.create("列表验证"))
    resp = client.list()
    data = assert_ok(resp)
    ids = [c["id"] for c in data]
    assert created["id"] in ids

def test_list_unauthorized(auth_api):
    """越权：不带 token 访问对话列表返回 401"""
    client = ConversationApi()
    resp = client.list()
    assert_http_status(resp, 401)

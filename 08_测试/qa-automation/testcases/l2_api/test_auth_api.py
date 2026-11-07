"""L2 接口测试：auth 模块（注册/登录/登出）
四象限：正向 / 反向 / 边界 / 越权
"""
import pytest
from common.assert_util import assert_ok, assert_http_status
from api import AuthApi

# ---- 注册 ----
def test_register_success(temp_user):
    """正向：注册新用户成功"""
    # temp_user fixture 本身就完成了注册+登录，这里只验证数据字段
    assert temp_user["user_id"] > 0
    assert temp_user["token"]

def test_register_duplicate(temp_user):
    """反向：重复用户名注册返回 409"""
    client = AuthApi()
    resp = client.register(temp_user["username"], temp_user["password"])
    assert_http_status(resp, 409)

def test_register_empty_body(auth_api):
    """边界：空 body 注册返回 400（ValidationPipe）"""
    resp = auth_api.post("/auth/register", json={})
    assert_http_status(resp, 400)

def test_register_short_password(auth_api):
    """边界：密码 <6 位返回 400"""
    resp = auth_api.post("/auth/register", json={"username": "shortpw_user", "password": "123"})
    assert_http_status(resp, 400)

# ---- 登录 ----
def test_login_success(temp_user):
    """正向：登录返回 token 和 user 对象"""
    client = AuthApi()
    resp = client.login(temp_user["username"], temp_user["password"])
    data = assert_ok(resp)
    assert "access_token" in data
    assert data["user"]["username"] == temp_user["username"]
    assert data["user"]["role"] in ("user", "admin")

def test_login_wrong_password(temp_user):
    """反向：错密码返回 401"""
    client = AuthApi()
    resp = client.login(temp_user["username"], "wrongpassword")
    assert_http_status(resp, 401)

def test_login_nonexistent(auth_api):
    """反向：不存在的用户返回 401"""
    resp = auth_api.login("nobody_xxx_999", "whatever")
    assert_http_status(resp, 401)

# ---- 登出 ----
def test_logout_invalidates_token(temp_user):
    """正向：登出后旧 token 立即 401（JWT 黑名单）"""
    client = AuthApi(token=temp_user["token"])
    # 登出前 token 可用
    from api import ConversationApi
    before = ConversationApi(token=temp_user["token"]).list()
    assert before.status_code == 200
    # 登出
    out = client.logout()
    assert out.status_code in (200, 204)
    # 登出后旧 token 再访问受保护接口应 401
    after = ConversationApi(token=temp_user["token"]).list()
    assert_http_status(after, 401)

def test_logout_without_token(auth_api):
    """越权：未登录登出返回 401"""
    resp = auth_api.logout()
    assert_http_status(resp, 401)

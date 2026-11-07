"""L2 接口测试：health 与 admin"""
from common.assert_util import assert_ok, assert_http_status
from api import HealthApi, AdminApi

def test_health():
    """正向：健康检查返回 status=ok"""
    data = assert_ok(HealthApi().ping())
    assert data["status"] == "ok"
    assert data["uptime"] > 0

def test_admin_users_unauthorized():
    """越权：不带 token 访问 admin 返回 401"""
    resp = AdminApi().users()
    assert_http_status(resp, 401)

def test_admin_users_forbidden_for_normal_user(temp_user):
    """越权：普通 user 访问 /admin/users 返回 403"""
    client = AdminApi(token=temp_user["token"])
    resp = client.users()
    assert_http_status(resp, 403)

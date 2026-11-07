"""L1 单元测试：common 工具函数的纯逻辑（不碰 HTTP/DB）"""
from common.assert_util import assert_ok
from unittest.mock import MagicMock

def test_assert_ok_extracts_data():
    """assert_ok 正确解包 {code, data, message} 返回体"""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"code": 0, "data": {"id": 1}, "message": "ok"}
    data = assert_ok(mock_resp)
    assert data == {"id": 1}

def test_assert_ok_raises_on_biz_error():
    """assert_ok 在 code!=0 时抛 AssertionError"""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"code": 401, "data": None, "message": "unauthorized"}
    try:
        assert_ok(mock_resp)
        assert False, "should have raised"
    except AssertionError as e:
        assert "401" in str(e)

"""统一断言工具：后端全局返回体 {code, data, message}"""

def assert_ok(resp):
    """断言 HTTP 200/201 + code==0，返回 data"""
    assert resp.status_code in (200, 201), f"HTTP {resp.status_code}: {resp.text}"
    body = resp.json()
    assert body.get("code") == 0, f"业务 code={body.get('code')}: {body.get('message')}"
    return body.get("data")

def assert_http_status(resp, status):
    """断言 HTTP 状态码（用于 400/401/403/404/409 等错误场景）"""
    assert resp.status_code == status, f"expected {status}, got {resp.status_code}: {resp.text[:200]}"

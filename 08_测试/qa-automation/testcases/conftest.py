import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
import time
import random
from api import AuthApi, ConversationApi, HealthApi, AdminApi

def _unique_username(prefix="qauser"):
    return f"{prefix}_{int(time.time())}_{random.randint(100,999)}"

@pytest.fixture(scope="function")
def auth_api():
    return AuthApi()

@pytest.fixture(scope="function")
def temp_user():
    """自动注册一个临时用户并登录，返回 (username, password, token, auth_client_with_token)"""
    username = _unique_username()
    password = "Test1234!"
    client = AuthApi()
    reg = client.register(username, password)
    assert reg.status_code in (200, 201), f"注册失败: {reg.text}"
    login = client.login(username, password)
    data = login.json()["data"]
    token = data["access_token"]
    client.set_token(token)
    return {
        "username": username,
        "password": password,
        "token": token,
        "client": client,
        "user_id": data["user"]["id"],
    }

@pytest.fixture(scope="function")
def conv_api(temp_user):
    """带 token 的对话 API"""
    from api import ConversationApi
    c = ConversationApi(token=temp_user["token"])
    return c

@pytest.fixture(scope="function")
def msg_api(temp_user):
    from api import MessageApi
    return MessageApi(token=temp_user["token"])

@pytest.fixture(scope="function")
def admin_api():
    return AdminApi()

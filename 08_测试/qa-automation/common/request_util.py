import requests
import yaml
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / "config" / "config.yaml"

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

class ApiClient:
    """统一 HTTP 客户端：自动拼 base_url、自动带 token、自动解 code/data 包"""
    def __init__(self, base_url=None, token=None):
        cfg = load_config()
        self.base_url = base_url or cfg["base_url"]
        self.session = requests.Session()
        if token:
            self.set_token(token)

    def set_token(self, token):
        self.token = token
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            self.session.headers.pop("Authorization", None)

    def _request(self, method, path, **kwargs):
        url = f"{self.base_url}{path}"
        resp = self.session.request(method, url, timeout=15, **kwargs)
        return resp

    def post(self, path, **kwargs):
        return self._request("POST", path, **kwargs)

    def get(self, path, **kwargs):
        return self._request("GET", path, **kwargs)

    def delete(self, path, **kwargs):
        return self._request("DELETE", path, **kwargs)

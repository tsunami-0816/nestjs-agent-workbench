from common.request_util import ApiClient

class AuthApi(ApiClient):
    def register(self, username, password):
        return self.post("/auth/register", json={"username": username, "password": password})

    def login(self, username, password):
        return self.post("/auth/login", json={"username": username, "password": password})

    def logout(self):
        return self.post("/auth/logout")

class ConversationApi(ApiClient):
    def list(self):
        return self.get("/conversations")

    def create(self, title=None):
        body = {}
        if title:
            body["title"] = title
        return self.post("/conversations", json=body)

class MessageApi(ApiClient):
    def history(self, conv_id, page=1, size=20):
        return self.get(f"/conversations/{conv_id}/messages", params={"page": page, "size": size})

class HealthApi(ApiClient):
    def ping(self):
        return self.get("/health")

class AdminApi(ApiClient):
    def users(self):
        return self.get("/admin/users")

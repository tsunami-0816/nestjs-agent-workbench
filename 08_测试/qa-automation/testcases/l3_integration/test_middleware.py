"""L3 中间件集成测试（降级方案）：直接连真实 Docker MySQL/Redis 验证
不另起 Testcontainers（本机 16GB 内存，复用现有 nestjs-mysql / rag-redis）。
"""
import pytest
import subprocess

def mysql_query(sql):
    """在 nestjs-mysql 容器里执行 SQL，返回 stdout"""
    cmd = ["docker", "exec", "-i", "nestjs-mysql", "mysql", "-uroot", "-proot123",
           "--default-character-set=utf8mb4", "-N", "-e", sql]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

def test_mysql_roundtrip_utf8mb4():
    """L3-DB：中文+emoji 写入后原样读回"""
    # 用 conversations 表做回环：插入一条临时数据再读再删
    test_title = "L3集成测试🔥"
    mysql_query(f"USE nestjs_workbench; INSERT INTO conversations (user_id, title) VALUES (1, '{test_title}');")
    row = mysql_query(f"USE nestjs_workbench; SELECT title FROM conversations WHERE title='{test_title}';")
    assert test_title in row, f"utf8mb4 回读失败: {row}"
    mysql_query(f"USE nestjs_workbench; DELETE FROM conversations WHERE title='{test_title}';")

def test_redis_ping():
    """L3-缓存：Redis db=6 可连通"""
    cmd = ["docker", "exec", "rag-redis", "redis-cli", "-a", "123456", "--no-auth-warning",
           "-n", "6", "PING"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    assert "PONG" in r.stdout

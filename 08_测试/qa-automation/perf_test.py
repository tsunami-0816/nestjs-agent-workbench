"""轻量压测：三档并发 10/20/50，每档持续 10 秒
目标：GET /health（不依赖 DB/LLM 的纯读接口）
输出：平均 RT、P95 RT、TPS、错误率
"""
import time
import threading
import requests
import statistics

BASE = "http://localhost:8089"
DURATION = 10  # 秒

def worker(concurrency_results, stop_event):
    session = requests.Session()
    while not stop_event.is_set():
        start = time.perf_counter()
        try:
            r = session.get(f"{BASE}/health", timeout=5)
            elapsed = time.perf_counter() - start
            concurrency_results.append((elapsed, r.status_code))
        except Exception:
            elapsed = time.perf_counter() - start
            concurrency_results.append((elapsed, 0))

def run_tier(concurrency):
    results = []
    stop_event = threading.Event()
    threads = [threading.Thread(target=worker, args=(results, stop_event)) for _ in range(concurrency)]
    for t in threads: t.start()
    time.sleep(DURATION)
    stop_event.set()
    for t in threads: t.join()

    total = len(results)
    errors = sum(1 for _, code in results if code != 200)
    rts = sorted([elapsed for elapsed, _ in results])
    avg_rt = statistics.mean(rts) if rts else 0
    p95 = rts[int(len(rts) * 0.95)] if rts else 0
    tps = total / DURATION
    error_rate = errors / total if total else 0
    return {
        "concurrency": concurrency,
        "total_requests": total,
        "avg_rt_ms": round(avg_rt * 1000, 1),
        "p95_rt_ms": round(p95 * 1000, 1),
        "tps": round(tps, 1),
        "error_rate": f"{error_rate*100:.2f}%",
    }

if __name__ == "__main__":
    print(f"{'并发':>6} | {'总请求':>6} | {'平均RT(ms)':>10} | {'P95(ms)':>8} | {'TPS':>8} | {'错误率':>8}")
    print("-" * 70)
    for c in [10, 20, 50]:
        r = run_tier(c)
        print(f"{r['concurrency']:>6} | {r['total_requests']:>6} | {r['avg_rt_ms']:>10} | {r['p95_rt_ms']:>8} | {r['tps']:>8} | {r['error_rate']:>8}")

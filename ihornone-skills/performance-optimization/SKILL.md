---
name: performance-optimization
description: Universal performance optimization patterns for any project (TypeScript, Python, Go, Rust). Covers caching strategies, lazy loading, code splitting, database optimization, memory management, network optimization, compute optimization, and performance metrics. Web-specific metrics (Core Web Vitals) belong in web-performance.
---

# 📌 Performance Optimization

## 🎯 GOAL
**One sentence:** Systematically identify and eliminate performance bottlenecks across caching, database, memory, network, and compute layers — measuring first, optimizing deliberately, and verifying no regression.

> Example:
> Measure baseline performance, identify the actual bottleneck, apply the smallest effective optimization, benchmark again, and add regression monitoring where appropriate.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Language/runtime conventions** — `pprof` in Go, `criterion` in Rust, `cProfile` in Python, `clinic.js` in Node.js.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Performance budgets, SLOs, SLAs.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> **Critical rule:** Do not optimize code without evidence of a meaningful bottleneck.

---

## 💡 KEY PRINCIPLES
- **Measure First** — Profile before optimizing; don't guess what's slow.
- **Cache Deliberately** — Cache data when the performance benefit outweighs invalidation, consistency, memory, correctness, and privacy risks.
- **Load On Demand** — Defer non-critical work until it's needed.
- **Minimize Network** — Compress, deduplicate, batch, and prefetch.
- **Resource Lifecycle** — Every acquired resource must have a defined cleanup path.
- **Verify No Regression** — Benchmark before and after; add monitoring where appropriate.

---

## 🔧 PERFORMANCE INVESTIGATION WORKFLOW

```
Define the performance symptom
        ↓
Measure baseline (CPU, memory, I/O, network, latency)
        ↓
Identify the bottleneck
        ↓
Estimate expected impact
        ↓
Apply the smallest effective optimization
        ↓
Benchmark again
        ↓
Verify correctness and resource usage
        ↓
Add regression monitoring where appropriate
```

> **Do not skip steps.** Optimizing without measuring first often makes performance worse by adding complexity in the wrong place.

---

## 🔧 CACHING STRATEGIES

> **Cache deliberately.** Consider freshness requirements, invalidation complexity, consistency risks, memory usage, cache stampede, cache key correctness, privacy, and user/tenant isolation before caching.

### Server-Side Cache (Redis)

```python
# CORRECT: Cache with TTL and proper key design
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_user(user_id: str) -> dict:
    cache_key = f"user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    user = db.query("SELECT * FROM users WHERE id = %s", user_id)
    r.setex(cache_key, 300, json.dumps(user))  # TTL based on freshness requirements
    return user
```

### Cache Invalidation Patterns

| Pattern | When to Use | Risk |
|---|---|---|
| TTL (Time-To-Live) | Stale data acceptable for a period | Stale reads during TTL |
| Cache-aside | Read-heavy, infrequent writes | Cache miss on first read |
| Write-through | Strong consistency required | Write latency |
| Invalidate on write | Data changes frequently | Race conditions |
| Versioned keys | Complex invalidation scenarios | Key proliferation |

### CDN Cache (When Applicable)

| Content Type | Typical Duration | Notes |
|---|---|---|
| Static assets (hashed) | 1 year | Immutable, safe to cache long-term |
| Images | Context-dependent | Consider CDN with image optimization |
| API responses | Context-dependent | Only cache public, non-user-specific data |
| HTML | 0 (revalidate) | Dynamic content should not be cached |

> **Never cache user-specific or sensitive data in shared caches (CDN, public caches).** Use private caches with proper isolation.

---

## 🔧 LAZY LOADING

> **Defer non-critical work.** Load data, compute results, or initialize resources only when they're needed.

### Data Lazy Loading

```python
# CORRECT: Load data on demand with caching
def get_expensive_data(key: str) -> dict:
    if key not in cache:
        cache[key] = compute_expensive_result(key)
    return cache[key]
```

### Code/Module Lazy Loading

| Approach | When to Use |
|---|---|
| Dynamic imports | Framework-specific code splitting (see web-performance, mobile skills) |
| Deferred initialization | Heavy modules not needed at startup |
| On-demand loading | Features used rarely |

---

## 🔧 DATABASE OPTIMIZATION

### N+1 Query Prevention

> **Detect N+1 access patterns and replace them with an appropriate batching, joining, eager-loading, or prefetching strategy.** JOIN is one option, but not always the best — consider batch loading, DataLoader pattern, eager loading with ORM, or `IN (...)` queries depending on the use case.

```python
# WRONG: N+1 queries (1 + N queries)
users = db.query("SELECT * FROM users LIMIT 100")
for user in users:
    orders = db.query("SELECT * FROM orders WHERE user_id = %s", user.id)  # N queries!

# CORRECT: Batch loading with IN clause
users = db.query("SELECT * FROM users LIMIT 100")
user_ids = [u.id for u in users]
orders = db.query("SELECT * FROM orders WHERE user_id IN %s", (user_ids,))

# CORRECT: Single JOIN query (when appropriate)
users = db.query("""
    SELECT u.*, o.id as order_id, o.total
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LIMIT 100
""")
```

### Indexing Strategy

> **Choose indexes based on actual query patterns, cardinality, selectivity, data distribution, and execution plans. Verify indexes with query plans (`EXPLAIN` / `EXPLAIN ANALYZE`).**

| Scenario | Index Type | Notes |
|---|---|---|
| Frequent WHERE column | B-tree index | Most common; good for equality and range queries |
| Full-text search | GIN/GiST index | For text search, JSONB, arrays |
| Frequent JOIN column | Foreign key index | Often missing; check all FK columns |
| Composite WHERE | Composite index | Order matters; most selective column first |
| Filtered queries | Partial index | When queries filter on a subset of data |
| High cardinality | Covering index | Include all columns needed by the query |

> **Verify with EXPLAIN:** Always check query plans after adding indexes. An index that helps one query may hurt write performance or be ignored by the planner.

### Connection Pooling

```python
# CORRECT: Connection pool configuration (context-appropriate)
from sqlalchemy import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,           # Adjust based on workload and DB capacity
    max_overflow=5,         # Allow additional connections under load
    pool_pre_ping=True,     # Verify connections before use
    pool_recycle=1800,      # Recycle stale connections
)
```

> **Pool size is context-appropriate.** A small service may need 5-10 connections; a high-traffic service may need 50+. Monitor connection usage and adjust based on actual metrics, not fixed rules.

---

## 🔧 MEMORY OPTIMIZATION

### Resource Lifecycle

> **Every acquired resource must have a defined cleanup path.** This applies to event listeners, file handles, database connections, network sockets, timers, and any other resource that must be explicitly released.

```python
# CORRECT: Resource cleanup with context manager
with open('large_file.txt', 'r') as f:
    data = f.read()
# File handle automatically closed

# CORRECT: Database connection cleanup
with get_connection() as conn:
    result = conn.execute(query)
# Connection returned to pool
```

```typescript
// CORRECT: Event listener cleanup (universal principle)
// In any framework with lifecycle hooks:
// - React: useEffect return function
// - Vue: onUnmounted hook
// - Vanilla JS: removeEventListener
// - Go: defer for resources
// - Rust: RAII (Drop trait)

const cleanup = () => {
  window.removeEventListener('resize', handleResize);
};
// Call cleanup when component/resource is destroyed
```

### Large Data Structures

```typescript
// WRONG: Loading all data at once
const allUsers = await fetchAllUsers(); // 100K records in memory!

// CORRECT: Pagination or streaming
const page = await fetchUsers({ page: 1, limit: 100 });
// Or use ReadableStream for large datasets
```

### Memory Leak Detection

| Language | Tool |
|---|---|
| TypeScript/Node.js | `clinic.js`, Chrome DevTools Memory tab, `heapdump` |
| Python | `memory_profiler`, `tracemalloc`, `objgraph` |
| Go | `pprof` heap profile, `GODEBUG=gctrace=1` |
| Rust | `valgrind`, `cargo-valgrind`, `miri` |

---

## 🔧 NETWORK OPTIMIZATION

### Request Deduplication

> **Avoid duplicate in-flight requests for the same data.** This applies to any caching layer, not just frontend libraries.

```typescript
// CORRECT: Deduplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

function fetchWithDedup(key: string, fn: () => Promise<any>): Promise<any> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}
```

### Batch Requests

```typescript
// WRONG: N individual requests
for (const id of userIds) {
  await fetch(`/api/users/${id}`);
}

// CORRECT: Single batch request
await fetch('/api/users/batch', {
  method: 'POST',
  body: JSON.stringify({ ids: userIds }),
});
```

### Response Compression

> **Enable compression for text-based responses.** Use gzip or brotli for HTTP responses. Consider compression level trade-offs (CPU vs. compression ratio).

---

## 🔧 COMPUTE OPTIMIZATION

> **Offload expensive computation from the critical path.** Use background processing, worker threads, or async execution where appropriate.

### Background Processing

```typescript
// CORRECT: Offload heavy computation to worker thread
const worker = new Worker(new URL('./worker.ts', import.meta.url));
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => setResult(e.data);
```

> **Language-specific:**
> - Python: `concurrent.futures`, `multiprocessing`, `asyncio.to_thread`
> - Go: goroutines for I/O-bound, worker pools for CPU-bound
> - Rust: `std::thread`, `tokio::spawn_blocking`
> - Node.js: `worker_threads`, `child_process`

### Debounce / Throttle

```typescript
// CORRECT: Debounce frequent operations
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}
```

> **Debounce:** Execute after a quiet period (e.g., search input).
> **Throttle:** Execute at most once per interval (e.g., scroll events).

### Virtual Processing (Large Collections)

> **Process only what's needed.** For large collections, use pagination, streaming, or windowed processing instead of loading everything into memory.

---

## 🔧 PERFORMANCE METRICS

> **Define performance budgets based on user experience, workload, infrastructure, and business requirements.** The following are common reference points, not universal rules.

### Universal Metrics

| Metric | Typical Target | What It Measures |
|---|---|---|
| Latency (p50) | Context-dependent | Typical response time |
| Latency (p95/p99) | Context-dependent | Tail latency (important for SLIs) |
| Throughput | Context-dependent | Requests/operations per second |
| Error rate | < 0.1% (context-dependent) | Failed operations |
| CPU usage | < 70% sustained | Compute utilization |
| Memory usage | < 80% | Memory utilization |
| I/O wait | < 20% | Disk/network bottleneck |

> **Note:** Specific targets depend on the application type, infrastructure, and business requirements. A real-time system has different targets than a batch processor.

---

## ❌ ANTI-PATTERN (Wrong)

```python
# Problem: No caching, N+1 queries, no batching, no measurement

def get_user_dashboard(user_id):
    # NO CACHING — queries database on every request
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)

    # N+1 QUERIES — one query per order
    orders = []
    for order_id in user.order_ids:
        order = db.query("SELECT * FROM orders WHERE id = %s", order_id)
        orders.append(order)

    # NO BATCHING — individual API calls
    for order in orders:
        response = requests.get(f"/api/products/{order.product_id}")
        order.product = response.json()

    return {"user": user, "orders": orders}
```

**Why this is bad:**
- No caching — repeated work on every request.
- N+1 queries — O(N) database round-trips instead of O(1).
- No batching — sequential network requests instead of parallel/batched.
- No measurement — optimizing without knowing the bottleneck.

---

## 🚨 COMMON MISTAKES
1. **Optimizing without measuring** — Profile first; don't guess what's slow.
2. **No caching strategy** — Cache deliberately based on freshness, consistency, and correctness requirements.
3. **N+1 queries** — Detect and fix batch access patterns; use JOINs, batch loading, or DataLoader.
4. **Resource leaks** — Every acquired resource needs a cleanup path.
5. **Loading everything eagerly** — Defer non-critical work until needed.
6. **Ignoring tail latency** — p99 matters more than p50 for user experience.
7. **Not verifying optimizations** — Benchmark before and after; check for regressions.
8. **Premature optimization** — Don't optimize code paths that aren't bottlenecks.

---

## ✔️ CHECKLIST (Before Commit)

### During Development
- [ ] Performance symptom defined and measured
- [ ] Bottleneck identified (not guessed)
- [ ] Optimization is the smallest effective change

### Before Commit
- [ ] Caching configured where appropriate (consider freshness, consistency, privacy)
- [ ] Database queries optimized (no N+1, proper indexes)
- [ ] Connection pooling configured
- [ ] No obvious resource leaks
- [ ] Large data handled with pagination/streaming

### Before Merge
- [ ] Benchmark before optimization recorded
- [ ] Benchmark after optimization recorded
- [ ] Improvement verified
- [ ] No correctness regressions
- [ ] Performance monitoring active where appropriate

### Before Production
- [ ] Performance budgets defined (context-appropriate)
- [ ] Profiling tools available
- [ ] Regression detection configured

---

## 📚 CHEATSHEET

### Universal Patterns

| Optimization | Technique | Notes |
|---|---|---|
| Caching | Redis, Memcached, in-memory | Consider TTL, invalidation, isolation |
| Database index | B-tree, GIN/GiST, composite | Verify with EXPLAIN |
| N+1 prevention | JOINs, batch loading, DataLoader | Choose based on use case |
| Connection pool | Configured pool size | Adjust based on workload |
| Memory cleanup | Context managers, RAII, defer | Every resource needs cleanup |
| Large data | Pagination, streaming, chunking | Don't load everything at once |
| Request dedup | In-flight request cache | Avoid duplicate work |
| Batching | Combine N requests into 1 | Reduces round-trips |
| Debounce | Delay execution until quiet | For frequent triggers |
| Throttle | Limit execution rate | For rate-limited operations |
| Background work | Worker threads, goroutines | Offload from critical path |

### Profiling Tools

| Language | CPU Profiling | Memory Profiling | Benchmarking |
|---|---|---|---|
| TypeScript/Node.js | `clinic.js`, `0x`, Chrome DevTools | `heapdump`, DevTools Memory | `benchmark.js` |
| Python | `cProfile`, `py-spy` | `memory_profiler`, `tracemalloc` | `pytest-benchmark` |
| Go | `pprof` | `pprof` heap | `testing.B`, `benchstat` |
| Rust | `perf`, `cargo-flamegraph` | `valgrind`, `miri` | `criterion` |

### Web-Specific (See [`web-performance`])

| Optimization | Tool/Technique |
|---|---|
| Image lazy loading | `IntersectionObserver` + `loading="lazy"` |
| Code splitting | Dynamic imports, route-level chunks |
| Virtual scrolling | `react-window`, `react-virtuoso` |
| Web Vitals | `web-vitals` library |

---

## 🔗 RELATED SKILLS
- ⬆️ [`web-performance`] – Web-specific optimizations (Next.js, Vite, Core Web Vitals)
- ⬆️ [`logging-standards`] – Performance logging for slow operations
- ⬆️ [`error-handling-standards`] – Timeout and retry for resilience
- ⬆️ [`testing-patterns`] – Performance testing and benchmarking

---

## 📝 NOTES
- **Profiling tools:**
  - Node.js: `clinic.js` for profiling, `0x` for flame graphs
  - Python: `cProfile`, `py-spy`, `memory_profiler`
  - Go: `pprof`, `benchstat` for benchmarking
  - Rust: `criterion` for benchmarks, `cargo-flamegraph` for profiling
- **Regression protection:** Always benchmark before and after optimization. Add performance monitoring in production for critical paths.
- **Web-specific optimizations:** See [`web-performance`] for frontend-specific patterns (code splitting, image optimization, Web Vitals, virtual scrolling, bundle optimization).
- **Mobile-specific optimizations:** See mobile skills for Flutter/React Native performance patterns.
- **Performance budgets:** Define based on user experience, workload, infrastructure, and business requirements — not arbitrary numbers.

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition

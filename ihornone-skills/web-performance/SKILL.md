---
name: web-performance
description: Production-grade web performance optimization patterns for React, Next.js, Vue, Svelte, and Astro applications. Covers code splitting, lazy loading, image optimization, bundle analysis, tree shaking, CSS optimization, caching strategies, Core Web Vitals (LCP, INP, CLS), SSR/SSG strategies, performance monitoring, Lighthouse auditing, and performance budgets.
---

# 📌 Web Performance

## 🎯 GOAL
**One sentence:** Optimize web application speed, bundle size, and rendering performance to achieve Core Web Vitals targets (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) and Lighthouse scores > 90.

> Example:
> Implement code splitting per route, optimize images to WebP with responsive sizing, configure caching headers, and monitor performance with Sentry and Lighthouse CI.

---

## 💡 KEY PRINCIPIONS
- **Measure First, Optimize Second** – Use Lighthouse, Web Vitals, and bundle analyzer to identify actual bottlenecks before guessing. Profile before memoizing.
- **Lazy-Load Non-Critical** – Code split by route, lazy load below-the-fold components, defer non-critical scripts. Do NOT lazy-load above-the-fold content without evidence.
- **Cache According to Data Ownership** – Static assets get long-lived cache headers. API responses cache according to data ownership, volatility, freshness requirements, and privacy constraints. Never mark authenticated or user-specific API responses as `public` cacheable.
- **Minimal Critical Path** – Reduce initial bundle size, inline critical CSS, defer non-critical JavaScript.

---

## 🧠 PERFORMANCE DECISION TREE

Use this tree when a performance problem is detected.

```
Performance problem detected
        ↓
    Measure (Lighthouse, DevTools, RUM)
        ↓
Identify bottleneck
        ↓
Is it network?
 ├─ yes → caching / preload / compression / CDN / reduce payload
 └─ no
      ↓
Is it JavaScript?
 ├─ yes → bundle analysis / code splitting / remove unused deps / tree shaking
 └─ no
      ↓
Is it rendering?
 ├─ yes → component optimization / reduce re-renders / CSS containment
 └─ no
      ↓
Is it asset-related?
 ├─ yes → image/font/media optimization / modern formats / responsive sizing
 └─ no → profile further (DevTools Performance tab, flame chart)
```

### Lab vs Real User Monitoring (RUM)

| Aspect | Lab Data | Real User Monitoring |
|---|---|---|
| Tool | Lighthouse, WebPageTest | Web Vitals library, Sentry, CrUX |
| Environment | Throttled network/device | Actual user devices & networks |
| Use case | CI, regression detection, debugging | Production performance, geographic variance |
| Limitation | Synthetic, may not reflect reality | Noisy, requires traffic volume |

**Rule:** Use lab data for debugging and CI gates. Use RUM for production targets and user experience validation.

---

## 📐 PRELOAD / PREFETCH / PRIORITY

- **Preload** (`<link rel="preload">`) — critical resources needed for current navigation (LCP image, critical font). Use sparingly; preloading everything defeats the purpose.
- **Prefetch** (`<link rel="prefetch">`) — resources likely needed for next navigation. Use for likely next pages.
- **Priority hints** (`fetchpriority="high"`) — hint to browser about resource importance.

**Rules:**
- Preload ONLY critical resources (1-2 max).
- Do NOT preload above-the-fold images that are already in initial HTML.
- Prefetch next likely navigation, not entire site.

---

## 🔤 FONT PERFORMANCE

- **Format** — use WOFF2 (best compression).
- **Subset** — include only needed characters/weights.
- **font-display** — use `swap` or `optional` to avoid FOIT (Flash of Invisible Text).
- **Preload** — only critical fonts (e.g., heading font), not entire font family.
- **Limit weights** — each weight is a separate network request.

---

## 📦 THIRD-PARTY SCRIPTS

Treat third-party JavaScript as untrusted performance cost.

| Script type | Risk | Mitigation |
|---|---|---|
| Analytics (GA, Mixpanel) | High — blocks parsing | Load async/defer, use `requestIdleCallback` |
| Chat widgets | High — heavy bundle | Lazy load on user interaction |
| Ads | Very high — unpredictable | Isolate in iframe, lazy load |
| Maps | High — large bundle | Lazy load when map comes into viewport |
| Social embeds | Medium — multiple requests | Use static fallback, load on interaction |
| A/B testing | Medium — render blocking | Async, minimal blocking snippet |

**Rule:** Load third-party scripts only when business value justifies the performance impact.

---

## 📁 PERFORMANCE TOOLKIT

```
performance/
├── lighthouse.config.ts     # Lighthouse CI configuration
├── budget.json              # Performance budget thresholds
├── bundle-analyzer.config.ts # Webpack/Vite bundle analysis
└── web-vitals.ts            # Custom Web Vitals reporting
```

---

## 🔧 BEST PRACTICES

1. **Route-Level Code Splitting**
   - Use dynamic `import()` or Next.js `next/dynamic` to split code per route. Never bundle all pages together.

2. **Image Optimization**
   - Use the framework's image optimization pipeline when available (Next.js `<Image>`, `vite-imagetools`).
   - Use native `<img>` when optimization is unnecessary (SVG, tiny static assets, external URLs, specialized loading behavior, non-Next.js apps).
   - Always provide `width`/`height` or `aspect-ratio` to prevent CLS.

3. **Define Performance Budgets**
   - Set budgets based on device/network targets and business requirements.
   - Example budgets: Initial JS < X KB, Initial CSS < Y KB, LCP image < Z KB.
   - Enforce budgets in CI (fail build on regression).

4. **Caching Headers**
   - Static assets: `Cache-Control: public, max-age=31536000, immutable`.
   - HTML pages: `Cache-Control: public, max-age=0, must-revalidate`.
   - Authenticated/user-specific API: `Cache-Control: private, no-store` or `private, max-age=0`.
   - Public read-only API: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
   <!-- ЗМІНЕНО: додано уточнення про багаторівневе кешування з явною інвалідацією на мутаціях — підтверджено практикою: Appwrite, Cal.com, Medusa, Prisma Next, Fastify, NestJS (analysis-synthesis/performance-consensus.md, Правило 1) -->
   - Налаштовуй багаторівневе кешування (in-memory + Redis + інфраструктурне), де кінцевий рівень (наприклад, `unstable_cache`) має явну інвалідацію при мутаціях. Appwrite викликає `purgeCachedDocument()` в тому ж HTTP-запиті, Medusa інвалідує за тегами через SCAN + pipeline UNLINK. Без явної інвалідації клієнти отримують застарілі дані до істекання TTL.

5. **Core Web Vitals Monitoring**
   - Track LCP, INP, CLS in production via RUM. Alert on regressions.
   - FID is deprecated; use INP as the primary responsiveness metric.

<!-- ДОДАНО: паралелізація незалежних операцій — 7 з 9 production-репозиторіїв (Appwrite, Cal.com, Medusa, NestJS, Prisma Next, tRPC, Fastify) — analysis-synthesis/performance-consensus.md, Правило 2 -->
6. **Паралелізація незалежних операцій**
   - Паралелізуй незалежні API-виклики через `Promise.all` / `useQueries` (TanStack Query). Не роби послідовних викликів, якщо операції не залежать одна від одної.
   - Приклади: Appwrite використовує `Swoole\Coroutine\batch` для паралельних HTTP-запитів; cal.diy — `Promise.all` для bookings + OOO; Medusa — `Promise.all` у workflow-кроках; NestJS — паралельне резолвіння параметрів DI; tRPC — `Promise.all(rpcCalls)` у batch-запиті.
   - Обмежуй concurrency (наприклад, MAX_CONCURRENT_REQUESTS=10), щоб запобігти thundering herd.

<!-- ДОДАНО: свідома послідовність для залежних операцій — 7 з 9 production-репозиторіїв — analysis-synthesis/performance-consensus.md, Правило 3 -->
7. **Свідома послідовність для залежних операцій**
   - Коли операції залежні (наприклад, отримати `userId` перед отриманням `bookings`), виконуй їх послідовно, але паралелізуй все інше, що не залежить від результату.
   - Послідовність потрібна, коли: (1) крок N потребує результату кроку N-1; (2) операції конфліктують через shared mutable state; (3) зовнішні API мають rate limits; (4) протокол вимагає певного порядку (OAuth).

<!-- ДОДАНО: гібридна пагінація — 5 з 9 production-репозиторіїв — analysis-synthesis/performance-consensus.md, Правило 4 -->
8. **Гібридна пагінація**
   - Для великих наборів даних використовуй курсорну пагінацію (cursor-based), для малих/стабільних — offset. Cursor краще при паралельних мутаціях, забезпечує O(1) доступ та стабільність сторінок. Offset простіший і дозволяє стрибнути на довільну сторінку, але деградує при великих значеннях.
   - Приклади: Appwrite — cursor для VCS/webhooks, offset для usage-аналітики; cal.diy — cursor для event types, fake cursor (offset) для bookings; tRPC — всі приклади курсорної пагінації (take + 1).

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: app/dashboard/page.tsx — Route-level code splitting
import dynamic from 'next/dynamic';
import { useQueries } from '@tanstack/react-query';

const HeavyChart = dynamic(() => import('../../components/features/HeavyChart'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />,
  ssr: false, // Client-only component
});

const DashboardMap = dynamic(() => import('../../components/features/DashboardMap'), {
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />,
});

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardMap />
      <HeavyChart />
    </div>
  );
}

// File: app/dashboard/bookings-page.tsx — Parallel independent queries + sequential dependent
export default function BookingsPage({ userId }: { userId: string }) {
  // SEQUENTIAL: need userId first
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // PARALLEL: bookings and stats are independent of each other
  const [bookingsQuery, statsQuery] = useQueries({
    queries: [
      { queryKey: ['bookings', userId], queryFn: () => fetchBookings(userId), enabled: !!userQuery.data },
      { queryKey: ['stats', userId], queryFn: () => fetchStats(userId), enabled: !!userQuery.data },
    ],
  });

  if (userQuery.isLoading) return <div>Loading user...</div>;
  return (
    <div>
      <h1>Bookings for {userQuery.data.name}</h1>
      {bookingsQuery.data?.map(b => <div key={b.id}>{b.title}</div>)}
      <div>Total: {statsQuery.data?.count}</div>
    </div>
  );
}

// File: components/features/HeavyChart.tsx — Memoized expensive render
'use client';

import React, { useMemo } from 'react';

interface ChartProps {
  data: number[];
  color: string;
}

export function HeavyChart({ data, color }: ChartProps) {
  // PERFORMANCE: Only memoize when profiling shows this computation is expensive
  // or when referential stability is required by child components.
  // Do NOT memoize because a computation "looks expensive" — measure first.
  const processedData = useMemo(() => {
    // Genuinely expensive computation (e.g., 10k+ data points with complex transforms)
    return data.map((value, index) => ({
      x: index,
      y: value,
      fill: color,
    }));
  }, [data, color]);

  return (
    <div className="h-96">
      {/* Chart implementation */}
      <pre>{JSON.stringify(processedData.slice(0, 3))}</pre>
    </div>
  );
}

// File: app/api/bookings/route.ts — Pagination example (cursor vs offset)
import { NextResponse } from 'next/server';

// CURSOR pagination — stable under parallel mutations, O(1) for large datasets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor'); // last ID from previous page
  const limit = parseInt(searchParams.get('limit') || '20');

  const bookings = cursor
    ? await db.bookings.findMany({ where: { id: { gt: cursor } }, take: limit + 1, orderBy: { id: 'asc' } })
    : await db.bookings.findMany({ take: limit + 1, orderBy: { id: 'asc' } });

  const hasMore = bookings.length > limit;
  if (hasMore) bookings.pop();

  return NextResponse.json({
    data: bookings,
    nextCursor: hasMore ? bookings[bookings.length - 1]?.id : null,
  });
}

// File: next.config.ts — Image optimization & headers
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          // SECURITY: Never use 'public' for authenticated/user-specific API responses.
          // Use 'private' or 'no-store' for user-specific data.
          // Only use 'public' for truly public, non-personalized API responses.
          // stale-while-revalidate allows serving cached content while revalidating.
          { key: 'Cache-Control', value: 'private, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lodash', '@mui/material', '@mui/icons-material'],
  },
};

export default nextConfig;

// File: lib/web-vitals.ts — Custom Web Vitals reporting
import { onCLS, onLCP, onINP, type Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,
  });

  // Use sendBeacon for non-blocking analytics
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
}

// File: app/layout.tsx
import { reportWebVitals } from '../lib/web-vitals';

// Report Web Vitals in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  reportWebVitals();
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No code splitting, unoptimized images, no caching, no performance monitoring

// ENTIRE APP IN ONE BUNDLE — 2MB initial load
import { Chart } from 'chart.js';
import { Map } from 'mapbox-gl';
import { PDFLib } from 'pdf-lib';
import { ExcelParser } from 'exceljs';

function Dashboard() {
  return (
    <div>
      {/* RAW <img> — no optimization, no lazy loading, no WebP */}
      <img src="/screenshots/dashboard.png" style={{ width: '100%' }} />

      {/* HEAVY COMPONENTS — always loaded, even if not visible */}
      <Chart data={bigData} />
      <Map center={[0, 0]} />
      <PDFLib file={pdfUrl} />
      <ExcelParser file={excelUrl} />
    </div>
  );
}

// NO CACHING HEADERS — every request hits server
// NO BUNDLE ANALYSIS — 2MB bundle shipped to users
// NO WEB VITALS — performance regressions go unnoticed
```

**Why this is bad:**
- 2MB+ initial bundle — slow first paint on mobile networks.
- Raw `<img>` — no lazy loading, no WebP, no responsive sizing.
- All heavy components loaded eagerly — even if user never scrolls to them.
- No caching — server receives identical requests every time.
- No monitoring — performance regressions undetected until users complain.

---

## 🚨 COMMON MISTAKES
1. **No code splitting** – Dynamic `import()` for routes and heavy components.
2. **Raw `<img>` when framework optimization is available** – Use the framework's image pipeline when it provides value. Native `<img>` is fine for SVG, tiny assets, or non-optimized contexts.
3. **No `Cache-Control` headers** – Static assets must have `immutable` + long `max-age`.
4. **Ignoring CLS** – Always set explicit `width`/`height` or `aspect-ratio` on images and media.
5. **Measuring only in Dev** – Always measure with production builds and RUM.
6. **Lazy-loading above-the-fold content** – Do NOT lazy-load critical content without evidence it improves performance.
7. **Memoizing without profiling** – Do NOT add `useMemo`/`useCallback` because code "looks expensive". Profile first.
8. **Public caching for authenticated API** – Never mark user-specific API responses as `public` cacheable.
9. <!-- ДОДАНО: послідовні незалежні виклики — 7 з 9 production-репозиторіїв паралелізують незалежні операції (analysis-synthesis/performance-consensus.md, Правило 2) -->
   **Послідовні незалежні виклики** — Не роби `await fetchA(); await fetchB();` якщо `fetchA` і `fetchB` не залежать одна від одної. Використовуй `Promise.all([fetchA(), fetchB()])` для зменшення загальної латентності.
10. <!-- ДОДАНО: відсутність явної інвалідації кешу при мутаціях — 7 з 9 репо (analysis-synthesis/performance-consensus.md, Правило 1) -->
    **Кеш без інвалідації при мутаціях** — При mutation інвалідуй кеш-записи для залучених ресурсів в тому ж HTTP-запиті. Інакше клієнти отримують застарілі дані до істекання TTL (наприклад, Medusa інвалідує за тегами через SCAN + UNLINK; Appwrite — `purgeCachedDocument()`).

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Code splitting configured per route (dynamic imports).
- [ ] Images optimized (WebP/AVIF, responsive sizing, lazy loading for below-fold).
- [ ] Performance budgets defined and enforced (JS, CSS, images per route).
- [ ] LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (measured in production RUM).
- [ ] Tree shaking enabled (no unused imports).
- [ ] Unused CSS removed (Tailwind `content` config or PurgeCSS).
- [ ] Lazy loading for below-fold components only (not above-the-fold).
- [ ] Caching headers configured (static assets, HTML, API with correct public/private).
- [ ] Third-party scripts loaded async/defer or lazy-loaded on interaction.
- [ ] Fonts optimized (WOFF2, subset, font-display: swap).
- [ ] DevTools Performance tab shows clean flame chart.
- [ ] Lighthouse score > 90 (Performance) in CI.
- [ ] Performance monitoring configured (Sentry, Web Vitals RUM, Lighthouse CI).
- [ ] <!-- ДОДАНО: пагінація стратегія визначена (analysis-synthesis/performance-consensus.md, Правило 4) -->
    Пагінація: курсор для великих/нестабільних наборів, offset для малих/стабільних.
- [ ] <!-- ДОДАНО: незалежні запити паралелізовані (analysis-synthesis/performance-consensus.md, Правило 2) -->
    Незалежні API-виклики паралелізовані через Promise.all / useQueries.

---

## 📚 CHEATSHEET
| Optimization | Tool/Technique | Target |
|---|---|---|
| Code splitting | `React.lazy()`, `next/dynamic` | Per-route chunks |
| Image optimization | `next/image`, WebP/AVIF, responsive | < 100KB per image |
| Bundle analysis | `webpack-bundle-analyzer`, `source-map-explorer` | Per-route budget |
| Caching | `Cache-Control: immutable` + explicit invalidation | 1 year for static |
| CSS optimization | Tailwind `content`, PurgeCSS | < 50KB CSS |
| Tree shaking | ES modules, `sideEffects: false` | Dead code removed |
| Web Vitals | `web-vitals` library + RUM analytics | LCP ≤ 2.5s, INP ≤ 200ms |
| Lighthouse CI | `lhci autorun` in CI pipeline | Score > 90 |
| Font optimization | WOFF2, subset, `font-display: swap` | No FOIT, minimal weights |
| Third-party scripts | Async/defer, lazy load on interaction | Minimize blocking |
| Preload | `<link rel="preload">` for critical only | 1-2 resources max |
| Pagination | Cursor for large/unstable, offset for small/stable | Stable pages, O(1) cursor |
| Parallel queries | `Promise.all`, `useQueries` | Reduced total latency |

---

## 🔗 RELATED SKILLS
- ⬆️ [`web-project-structure`] – Build output and asset organization
- ⬆️ [`web-components-patterns`] – `React.memo`, `useMemo`, lazy loading
- ⬆️ [`web-state-management`] – Hydration, re-render optimization
- ⬆️ [`web-api-client`] – Caching, deduplication, request optimization

---

## 📝 NOTES
- For Next.js: use `generateStaticParams` for SSG pages (zero server cost).
- For Vite: configure `build.rollupOptions.output.manualChunks` for vendor splitting.
- For Astro: use island architecture — zero JS by default, hydrate only interactive components.
- For CI: run Lighthouse CI on every PR, fail on performance regression.
- For RUM: use `web-vitals` library to report Core Web Vitals from real users.
- For fonts: use `next/font` (Next.js) for automatic optimization and self-hosting.
<!-- ПІДТВЕРДЖЕНО: багаторівневе кешування з інвалідацією — 7/9 production-репозиторіїв — analysis-synthesis/performance-consensus.md, Правило 1 -->
- Multilevel caching (in-memory + Redis + infra) з явною інвалідацією при мутаціях — підтверджено практикою: Appwrite, Cal.com, Medusa, Prisma Next, Fastify, NestJS, Drizzle.
<!-- ДОДАНО: слабкий сигнал fire-and-forget — 2/9 репозиторіїв — analysis-synthesis/performance-consensus.md, Слабкий сигнал 1 -->
- Для не-critical операцій (логування, аналітика) можна використовувати fire-and-forget (запис в кеш без `await`), але тільки якщо втрата даних прийнятна. Appwrite і cal.diy роблять це для запису в кеш — приоритет швидкості відповіді клієнту.
<!-- ДОДАНО: відсутність єдиного envelope зменшує розмір відповіді — 7/9 репозиторіїв не використовують envelope — analysis-synthesis/api-design-consensus.md, Правило про відсутність envelope -->
- Відсутність єдиного `{data: ...}` envelope в успішних відповідях (7/9 репозиторіїв) зменшує розмір відповіді та спрощує споживання. Обгортка доцільна лише при складних відповідях (пагінація, мета-інформація) або при суміжних протоколах (JSON-RPC в tRPC).
<!-- ДОДАНО: DataLoader на клієнті — 2/9 репозиторіїв — analysis-synthesis/performance-consensus.md, Слабкий сигнал 2 -->
- tRPC має вбудований `httpBatchLink`/`httpBatchStreamLink` для автоматичного батчингу паралельних викликів в один HTTP-запит. Корисно при паралельних викликах однакових процедур.
<!-- ДОДАНО: пагінація — курсор краще при паралельних мутаціях — analysis-synthesis/performance-consensus.md, Правило 4 -->
- Cursor-based пагінація особливо корисна при паралельних мутаціях — нові записи не змінюють позицію вже відданих сторінок, на відміну від offset.

---

**Last Updated:** 2026-08-29
**Version:** 4.0 (Updated with analysis from 9 production repos: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC, 2026-08-29)

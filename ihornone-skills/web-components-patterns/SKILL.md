---
name: web-components-patterns
description: Production-grade reusable UI component patterns for React, Next.js, Vue, and Svelte. Covers typed props, composition patterns, controlled/uncontrolled components, error boundaries, Suspense/lazy loading, accessibility (ARIA), SEO for SSR components, memoization, Storybook, and testing with Jest + Testing Library.
---

# 📌 Web Components Patterns

## 🎯 GOAL
**One sentence:** Build typed, accessible, composable, and performant reusable UI components that work across any modern web framework without hardcoded values.

> Example:
> Create a `Button` component with variant props, loading state, accessibility labels, keyboard navigation, and full TypeScript type safety.

---

## 💡 KEY PRINCIPIONS
- **Composition Over Configuration** – Build complex components by composing smaller primitives, not by adding endless props.
- **Typed Props, No Magic Values** – All props have TypeScript types; design values come from tokens/constants, not ad hoc literals in JSX.
- **Semantic HTML First, ARIA Second** – Prefer native HTML elements (`<button>`, `<input>`, `<nav>`) which already provide semantics, keyboard behavior, and accessibility tree roles. Add ARIA only when native semantics are insufficient. Never add redundant `role`, `tabIndex`, or `aria-label` without a specific accessibility reason.
- **Server/Client Boundary** – Mark client-only components with `'use client'`; keep server components as default for SSR/SEO.

---

## 📁 COMPONENT DIRECTORY STRUCTURE

<!-- ПІДТВЕРДЖЕНО: підтверджено практикою: Appwrite, Cal.com, Drizzle, Medusa, NestJS, Next-Auth, Prisma, tRPC (analysis-synthesis/architecture-consensus.md) — правило feature-based організації домінує в 9/9 production-репозиторіїв; навіть у проєктах з гібридною структурою (NestJS: common/ feature-based, core/ layer-based) доменна організація є домінантною -->

```
components/
├── ui/                    # Generic primitives
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css  (or .styles.ts)
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   ├── Button.types.ts
│   │   └── index.ts
│   ├── Input/
│   ├── Card/
│   ├── Modal/
│   ├── Text/
│   └── Container/
├── forms/                 # Form-specific
│   ├── Select/
│   ├── DatePicker/
│   ├── Checkbox/
│   └── FormField/
├── layout/                # Structural
│   ├── Header/
│   ├── Footer/
│   ├── Sidebar/
│   └── PageContainer/
└── features/              # Feature-specific
    ├── UserProfile/
    ├── PostCard/
    └── Dashboard/
```

---

## 🧠 COMPONENT DECISION RULES

Use this tree before creating or modifying a component. Rules trump the default layout.

- **Is it used by multiple features?**
  - No → keep it feature-local (`features/<name>/`).
  - Yes → proceed.

- **Is it a generic UI primitive (Button, Input, Card)?**
  - Yes → put it in `ui/`.
  - No → does it contain domain-specific behavior?
    - Yes → keep it inside the feature.

- **Can native HTML provide the required behavior?**
  - Yes → prefer the native element (`<button>`, `<input>`, `<select>`, `<dialog>`). Do NOT build a custom component with ARIA unless native semantics are insufficient.

- **Does the component require many boolean/variant props (>5)?**
  - Yes → consider **composition** or **compound components** instead of a monolithic props API.

- **Is state externally controlled (parent owns the value)?**
  - Yes → use a **controlled API** (`value` + `onChange`).

- **Is internal state sufficient?**
  - Yes → use an **uncontrolled API** (`defaultValue` + internal state).

- **Is performance actually a problem?**
  - Profile first. Do NOT introduce `memo`/`useMemo`/`useCallback` solely to avoid object creation. Optimize referential stability only when profiling or component architecture indicates unnecessary renders.

- **Does accessibility require custom ARIA?**
  - Prefer semantic HTML first. Add ARIA only when native semantics are insufficient.

---

## 🔀 CONTROLLED vs UNCONTROLLED API

A component must clearly declare which pattern it supports and behave predictably in both.

### Controlled (parent owns state)
```tsx
<Input value={value} onChange={setValue} />
```
- Parent passes `value` and `onChange`.
- Component is a pure display of the parent's state.
- Use when: form state must be validated/transformed by parent, or multiple inputs are coordinated.

### Uncontrolled (component owns state)
```tsx
<Input defaultValue="John" />
```
- Component manages its own internal state via `useState`.
- Use when: simple local input, no parent coordination needed.

### Dual-mode component (supports both)
```tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  value?: string;        // controlled
  defaultValue?: string; // uncontrolled fallback
  onChange?: (value: string) => void;
}

export function Input({ value, defaultValue, onChange, ...rest }: InputProps) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInternal(next);
    onChange?.(next);
  };

  return <input value={currentValue} onChange={handleChange} {...rest} />;
}
```

**Rules:**
- Never silently switch between controlled and uncontrolled at runtime — it causes React warnings and lost state.
- If a component supports both, detect the mode once on mount and warn if it changes.
- Document which mode is the default.

---

## 🧩 COMPOSITION & COMPOUND COMPONENTS

When a component needs many props to describe its behavior, composition is usually the better API.

### Compound component pattern
Instead of one component with 10 props:
```tsx
// ❌ Too many props
<Card title="..." subtitle="..." actions={[...]} footer="..." loading={false} />
```

Use a compound component:
```tsx
// ✅ Compound API
<Card>
  <Card.Header>
    <Card.Title>...</Card.Title>
    <Card.Subtitle>...</Card.Subtitle>
  </Card.Header>
  <Card.Content>...</Card.Content>
  <Card.Footer>
    <Card.Actions>...</Card.Actions>
  </Card.Footer>
</Card>
```

### Slots / render props
When a child needs data from the parent:
```tsx
<Dropdown>
  <Dropdown.Trigger>Open</Dropdown.Trigger>
  <Dropdown.Menu>
    {({ close }) => (
      <Dropdown.Item onSelect={close}>Action</Dropdown.Item>
    )}
  </Dropdown.Menu>
</Dropdown>
```

**When to use composition over props:**
- More than 5 boolean/variant props.
- Children need access to parent state.
- The component has multiple distinct visual regions.
- You find yourself adding `renderHeader`, `renderFooter`, `headerSlot` props.

---

## 📐 COMPONENT API STABILITY

A component's public API is a **contract**. Treat it with the same care as a public library API.

**Before adding a prop, check:**
1. Can the same result be achieved through **composition** (`children`)?
2. Can it be solved with **CSS variants** or **style overrides**?
3. Would a **specialized component** be cleaner than a generic one with a flag?
4. Is this prop solving a **one-off local use case**? If so, keep it local.

**Rules:**
- Do NOT add a prop to solve a single local use case if composition works.
- Do NOT expose internal implementation details as props.
- Prefer **explicit props** over **generic `config` objects**.
- Document breaking changes clearly.

---

## 🔧 BEST PRACTICES

1. **Extract Types to Separate File**
   - Keep `Component.types.ts` alongside the component for clean imports and type reuse.

2. **Use `React.memo` Selectively**
   - Memoize components that receive complex objects/arrays as props and render frequently. Don't memo everything.

3. **Default Props via Destructuring**
   - Provide sensible defaults in function signature, not in `.defaultProps` (deprecated pattern).

4. **Error Boundaries Around Feature Zones**
   - Wrap major UI sections in error boundaries so a crash in one feature doesn't white-screen the entire app.

5. **Suspense for Async Components**
   - Use `<Suspense fallback={<Skeleton />}>` with `React.lazy()` for route-level code splitting.

<!-- ДОДАНО: принцип підтверджується analysis-synthesis/architecture-consensus.md — у 9/9 production-репозиторіїв файли не розбивають за штучними лімітами рядків, якщо вони є cohesive unit; перевага цілісності над дробленням -->

6. **No Artificial File Size Limits**
   - If a component and its styles/tests/types form a cohesive unit, do NOT split it solely to satisfy arbitrary line-count thresholds. Split by conceptual responsibility, not by line count. A large file is acceptable if splitting would force consumers to import from multiple files for the same conceptual entity.

<!-- ДОДАНО: правило з consensus testing-ci-consensus.md (8/9 репозиторіїв) — мокують зовнішні сервіси в unit-тестах, реальні запити/БД тільки в integration/E2E; застосовується до тестування UI-компонентів через API-виклики -->

7. **Mock External Services in Component Tests**
   - When testing components that make API calls, mock the network layer (e.g., MSW, `jest.fn()`, `vi.fn()`). Real network requests should only appear in integration or E2E tests. This keeps component tests fast, deterministic, and independent of external infrastructure.

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: components/ui/Button/Button.types.ts
import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

// File: components/ui/Button/Button.tsx
'use client';

import React from 'react';
import { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
import { cn } from '../../../utils/cn';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
  ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon && <span className="mr-2">{leftIcon}</span>
      )}
      {children ?? label}
      {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

// File: utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// File: components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button label="Click" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button label="Save" loading />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No types, hardcoded values, no accessibility, inline styles, no error boundary

function Button({ title, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#007AFF',  // HARDCODED COLOR
        padding: '12px 24px',        // HARDCODED SPACING
        borderRadius: '8px',
        border: 'none',
        color: '#fff',
        fontSize: '16px',
        cursor: 'pointer',
      }}
    >
      {title}
    </button>
  );
}

// NO ACCESSIBILITY — screen readers cannot identify this button
// NO LOADING STATE — no feedback during async operations
// NO TYPE SAFETY — any prop value accepted silently
// INLINE STYLES — no CSS optimization, no dark mode support
// NO ERROR BOUNDARY — crash breaks entire app
```

**Why this is bad:**
- Hardcoded colors break theming and dark mode.
- No accessibility — unusable for screen reader users.
- No TypeScript types — prop errors only caught at runtime.
- Inline styles prevent CSS optimization and caching.
- No loading/disabled states — poor UX during async operations.

---

## 🚨 COMMON MISTAKES
1. **Redundant ARIA on native elements** – `<button>Save</button>` already has role, keyboard behavior, and accessible name. Do NOT add `role="button"`, `tabIndex={0}`, or `aria-label="Save"` unless there is a specific accessibility reason.
2. **Passing new objects/arrays as props without profiling** – New object references can cause unnecessary re-renders in memoized components, but do NOT add `useMemo`/`useCallback` preemptively. Profile first, optimize only when a problem is measured.
3. **Client components without `'use client'`** – Breaks SSR; React hooks fail in server components.
4. **Prop drilling through 3+ levels** – Use context, composition, or render props instead.
5. **Adding props for one-off local use cases** – If composition (`children`, slots) solves it, do NOT add a prop. Component API is a contract.
6. **Mocking internal module logic instead of boundaries** – Prefer mocking at the component boundary (e.g., API client, event handlers) rather than deep internal implementation details. This keeps tests resilient to refactoring.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] All props have TypeScript types with explicit interfaces.
- [ ] Component is functional with hooks (no class components).
- [ ] Design values come from tokens/constants, not ad hoc literals in JSX.
- [ ] Native HTML semantics are used where possible (no redundant ARIA).
- [ ] ARIA is added only when native semantics are insufficient.
- [ ] Located in the correct directory (`/ui/`, `/forms/`, `/layout/`, `/features/`).
- [ ] Each component has `index.ts` barrel export.
- [ ] Error boundary wraps feature zones where appropriate.
- [ ] Client components marked with `'use client'`.
- [ ] Component supports controlled, uncontrolled, or both (documented).
- [ ] Props API is stable — no one-off local props that composition could solve.
- [ ] Component tests mock external API calls; real network requests are limited to integration/E2E.

---

## 📚 CHEATSHEET
| Pattern | When to Use | Example |
|---|---|---|
| `React.memo` | Expensive render, stable props | `export const Card = React.memo(CardImpl)` |
| `useMemo` | Complex computed values | `const sorted = useMemo(() => [...items].sort(), [items])` |
| `useCallback` | Event handlers passed to children | `const handlePress = useCallback(() => ..., [])` |
| Error Boundary | Feature zone crash isolation | `<ErrorBoundary><FeatureScreen /></ErrorBoundary>` |
| Suspense | Async/lazy component loading | `<Suspense fallback={<Skeleton />}><LazyPage /></Suspense>` |
| `'use client'` | Components with hooks/state | `'use client'; import { useState } from 'react'` |
| Controlled API | Parent owns state | `<Input value={v} onChange={setV} />` |
| Uncontrolled API | Component owns state | `<Input defaultValue="John" />` |
| Compound Components | Many props → composition | `<Card><Card.Header /><Card.Content /></Card>` |
| Render Props / Slots | Child needs parent data | `<Dropdown.Menu>{({ close }) => ...}</Dropdown.Menu>` |
| MSW / Mock Service Worker | Mock API in component tests | `setupWorker(...)` |

---

## 🔗 RELATED SKILLS
- ⬆️ [`web-project-structure`] – Directory layout where components live
- ⬇️ [`web-state-management`] – Components consume state from store
- ⬇️ [`web-api-client`] – Components trigger API calls via hooks
- ⬇️ [`web-performance`] – Memoization and lazy loading optimization
- ⬇️ [`web-security`] – XSS prevention in components

---

## 📝 NOTES
- For Vue: use `<script setup lang="ts">` with `defineProps<T>()` for typed props.
- For Svelte: use `export let prop: Type` with `<script lang="ts">`.
- For Storybook: create `*.stories.tsx` files alongside components for visual testing.

<!-- ПІДТВЕРДЖЕНО: підтверджено практикою: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Prisma, tRPC (analysis-synthesis/architecture-consensus.md) — у 9/9 production-репозиторіїв файли зберігаються як cohesive unit, навіть якщо вони 500–5000+ рядків; розбиття відбувається за концептуальною відповідальністю, а не за кількістю рядків -->
- File size is not a reason to split. If a component and its related files represent a cohesive unit, keep them together even if the main file exceeds common arbitrary limits (e.g., 300/500 LOC). Split only when responsibilities diverge.

<!-- ДОДАНО: правило з consensus testing-ci-consensus.md (8/9 репозиторій) — мокують зовнішні сервіси в unit-тестах, реальна БД/мережа тільки в integration/E2E; прямо застосовне до тестування UI-компонентів -->
- Component tests should mock external API calls (MSW, `jest.fn()`, `vi.fn()`). Real network requests and database access belong in integration/E2E tests only.

---

**Last Updated:** 2026-08-29
**Version:** 4.0 (Updated with analysis from 9 production repos: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC, 2026-08-29)

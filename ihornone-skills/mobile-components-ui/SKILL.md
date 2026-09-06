---
name: mobile-components-ui
description: Production-grade reusable UI component patterns for React Native, Expo, and Flutter. Covers composition patterns, compound components, typed props, controlled/uncontrolled components, accessibility, design tokens, platform-specific code, responsive design, performance optimization, error boundaries, and snapshot testing.
---

# 📌 Mobile Components UI

## 🎯 GOAL
**One sentence:** Build typed, accessible, composable, and performant reusable UI components that work across platforms using design tokens and semantic theming.

> Example:
> Create a `Button` component with variant props, loading state, accessibility labels, theme-driven styling, and full TypeScript/Dart type safety.

---

## 💡 KEY PRINCIPLES
- **Composition Over Configuration** – Build complex components by composing smaller primitives, not by adding endless props.
- **Typed Props, Semantic Tokens** – All props have TypeScript/Dart types; consume design tokens (colors, spacing, typography) instead of hardcoded values.
- **Accessibility First** – Every interactive element exposes a correct accessible name, role, and state.
- **Platform-Specific When Necessary** – Use platform checks only for genuine platform differences, not cosmetic preferences.
- **Performance by Need** – Optimize only when profiling or component characteristics indicate a measurable benefit.

---

## 📁 COMPONENT DIRECTORY STRUCTURE

### Shared Reusable Components
Components that are reused across multiple features live in `shared/components/` or `components/ui/`:

```
shared/components/
├── ui/                    # Generic primitives (Button, Input, Card, Text)
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   ├── Button.test.tsx
│   │   ├── Button.types.ts
│   │   └── index.ts
│   ├── Input/
│   ├── Card/
│   └── Text/
├── forms/                 # Form-specific (Select, DatePicker, Checkbox)
│   ├── Select/
│   ├── DatePicker/
│   └── Checkbox/
└── layout/                # Structural (Spacer, Divider, Container)
    ├── Spacer/
    ├── Divider/
    └── Container/
```

### Feature-Specific Components
Components used only within one feature live in `features/<name>/components/`:

```
features/auth/
├── screens/
├── components/            # Feature-specific UI
│   ├── LoginForm/
│   ├── PasswordStrength/
│   └── SocialButtons/
├── hooks/
└── api/
```

**Critical Rule:** Do not put feature-specific components in `shared/components/`. If a component is only used in one feature, keep it there.

---

## 🧩 COMPOUND COMPONENTS

Build complex UIs by composing smaller primitives using compound pattern:

### Card Example

```typescript
// File: shared/components/ui/Card/Card.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export function Card({ children, variant = 'elevated' }: CardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {children}
    </View>
  );
}

// File: shared/components/ui/Card/CardHeader.tsx
export function CardHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

// File: shared/components/ui/Card/CardContent.tsx
export function CardContent({ children }: { children: React.ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

// File: shared/components/ui/Card/CardFooter.tsx
export function CardFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

// File: shared/components/ui/Card/index.ts
export { Card } from './Card';
export { CardHeader } from './CardHeader';
export { CardContent } from './CardContent';
export { CardFooter } from './CardFooter';

// Usage:
<Card variant="elevated">
  <CardHeader>
    <Text>Card Title</Text>
  </CardHeader>
  <CardContent>
    <Text>Card content goes here</Text>
  </CardContent>
  <CardFooter>
    <Button label="Action" />
  </CardFooter>
</Card>
```

**Why compound over configuration:**
```typescript
// BAD: Configuration hell
<Card
  showHeader
  showFooter
  showIcon
  showBadge
  compact
  elevated
  bordered
  title="..."
  subtitle="..."
  icon={...}
/>

// GOOD: Composition
<Card>
  <CardHeader><Text>Title</Text></CardHeader>
  <CardContent>...</CardContent>
  <CardFooter><Button /></CardFooter>
</Card>
```

---

## 🎨 DESIGN TOKENS & THEMING

### Theme Structure

```typescript
// File: shared/styles/theme.ts
import { createContext, useContext } from 'react';

export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    surface: string;
    background: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string; lineHeight: number };
    h2: { fontSize: number; fontWeight: string; lineHeight: number };
    body: { fontSize: number; fontWeight: string; lineHeight: number };
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}

const ThemeContext = createContext<ThemeTokens | null>(null);

export function ThemeProvider({ children, theme }: { children: React.ReactNode; theme: ThemeTokens }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeTokens {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}
```

### Component Consumes Theme Tokens

```typescript
// File: shared/components/ui/Button/Button.tsx
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
import { useTheme } from '../../../styles/theme';

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: 'primary', text: 'surface' },    // semantic tokens
  secondary: { bg: 'surface', text: 'text' },
  ghost: { bg: 'transparent', text: 'primary' },
  danger: { bg: 'error', text: 'surface' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors, spacing, typography, radii } = useTheme();
  const variantStyle = VARIANT_STYLES[variant];
  
  const bgColor = variantStyle.bg === 'transparent' 
    ? 'transparent' 
    : colors[variantStyle.bg as keyof typeof colors];
  const textColor = colors[variantStyle.text as keyof typeof colors];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          paddingVertical: spacing[size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'],
          paddingHorizontal: spacing[size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'],
          borderRadius: radii.md,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        rest.style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {leftIcon}
          <Text style={[{ color: textColor, fontSize: typography.body.fontSize, fontWeight: typography.body.fontWeight as any }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Rules:**
- Components consume `useTheme()` for colors, spacing, typography, radii.
- Never use `Colors.light.primary` directly — use semantic tokens.
- Design tokens enable dark mode by switching theme context.

---

## 🔧 BEST PRACTICES

### 1. Extract Types to Separate File
Keep `Component.types.ts` alongside the component for clean imports and type reuse.

### 2. Use React.memo Only When Profiling Shows Benefit
Do NOT add `React.memo` by default. Use it when:
- Component renders frequently (lists, animations)
- Props are stable (referentially equal)
- Profiling shows unnecessary re-renders

```typescript
// Only when needed:
export const ExpensiveCard = React.memo(CardImpl);

// NOT by default:
export const SimpleText = React.memo(Text); // Unnecessary
```

### 3. useMemo / useCallback Only for Referential Stability
Do NOT wrap everything in useMemo/useCallback. Use when:
- **useMemo:** Expensive computation OR referential stability needed for dependency arrays
- **useCallback:** Passing handlers to memoized children OR dependency array stability

```typescript
// GOOD: Referential stability for dependency array
const filteredItems = useMemo(() => items.filter(...), [items, query]);

// GOOD: Stable handler reference for memoized child
const handlePress = useCallback(() => { ... }, []);

// BAD: Premature optimization
const value = useMemo(() => 'static', []); // Unnecessary
```

### 4. Error Boundaries Catch Rendering Errors Only
Error boundaries catch errors during rendering, lifecycle methods, and constructors. They do NOT catch:
- Event handler errors
- Async errors (setTimeout, promises)
- Server-side rendering errors

```typescript
// Error boundary catches this:
function BrokenComponent() {
  throw new Error('Render error'); // Caught by boundary
}

// Error boundary does NOT catch this:
async function handleClick() {
  throw new Error('Async error'); // NOT caught by boundary
}
```

**Pattern:**
```typescript
<ErrorBoundary fallback={<ErrorScreen />}>
  <FeatureSection />
</ErrorBoundary>
```

### 5. Accessibility: Explicit Label When Needed
Provide `accessibilityLabel` explicitly when the accessible name cannot be derived from visible content:

```typescript
// Icon-only button — NEEDS explicit label
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Close dialog"
>
  <CloseIcon />
</Pressable>

// Button with visible text — label derived automatically
<Pressable accessibilityRole="button">
  <Text>Continue</Text>
</Pressable>
```

---

## ✅ CODE EXAMPLE (Correct) — React Native

```typescript
// File: shared/components/ui/Button/Button.types.ts
import { PressableProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  onPress: () => void;
}

// File: shared/components/ui/Button/Button.tsx
import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ButtonProps, ButtonVariant } from './Button.types';
import { useTheme } from '../../../styles/theme';

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: 'primary', text: 'surface' },
  secondary: { bg: 'surface', text: 'text' },
  ghost: { bg: 'transparent', text: 'primary' },
  danger: { bg: 'error', text: 'surface' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors, spacing, typography, radii } = useTheme();
  const variantStyle = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  const bgColor = variantStyle.bg === 'transparent'
    ? 'transparent'
    : colors[variantStyle.bg as keyof typeof colors];
  const textColor = colors[variantStyle.text as keyof typeof colors];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          paddingVertical: spacing[size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'],
          paddingHorizontal: spacing[size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'],
          borderRadius: radii.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
        },
        rest.style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {leftIcon}
          <Text style={[{ color: textColor, fontSize: typography.body.fontSize, fontWeight: typography.body.fontWeight as any }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// File: shared/components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
```

---

## ✅ CODE EXAMPLE (Correct) — Flutter

```dart
// File: shared/components/ui/button.dart
import 'package:flutter/material.dart';

enum ButtonVariant { primary, secondary, ghost, danger }
enum ButtonSize { sm, md, lg }

class Button extends StatelessWidget {
  final String label;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool loading;
  final bool disabled;
  final Widget? icon;
  final VoidCallback? onPressed;

  const Button({
    Key? key,
    required this.label,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.loading = false,
    this.disabled = false,
    this.icon,
    this.onPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final spacing = ThemeSpacing.of(context);

    final isDisabled = disabled || loading;

    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: _getBackgroundColor(colors),
        borderRadius: BorderRadius.circular(spacing.radiusMd),
        child: InkWell(
          onTap: isDisabled ? null : onPressed,
          borderRadius: BorderRadius.circular(spacing.radiusMd),
          child: Padding(
            padding: EdgeInsets.symmetric(
              vertical: _getVerticalPadding(spacing),
              horizontal: _getHorizontalPadding(spacing),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (loading)
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(_getTextColor(colors)),
                    ),
                  )
                else ...[
                  if (icon != null) ...[icon!, SizedBox(width: spacing.sm)],
                  Text(
                    label,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: _getTextColor(colors),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getBackgroundColor(ColorScheme colors) {
    switch (variant) {
      case ButtonVariant.primary:
        return colors.primary;
      case ButtonVariant.secondary:
        return colors.surface;
      case ButtonVariant.ghost:
        return Colors.transparent;
      case ButtonVariant.danger:
        return colors.error;
    }
  }

  Color _getTextColor(ColorScheme colors) {
    switch (variant) {
      case ButtonVariant.primary:
      case ButtonVariant.danger:
        return colors.onPrimary;
      case ButtonVariant.secondary:
        return colors.onSurface;
      case ButtonVariant.ghost:
        return colors.primary;
    }
  }

  double _getVerticalPadding(ThemeSpacing spacing) {
    switch (size) {
      case ButtonSize.sm:
        return spacing.xs;
      case ButtonSize.md:
        return spacing.sm;
      case ButtonSize.lg:
        return spacing.md;
    }
  }

  double _getHorizontalPadding(ThemeSpacing spacing) {
    switch (size) {
      case ButtonSize.sm:
        return spacing.md;
      case ButtonSize.md:
        return spacing.lg;
      case ButtonSize.lg:
        return spacing.xl;
    }
  }
}

// Usage:
// const Button(
//   label: 'Submit',
//   variant: ButtonVariant.primary,
//   size: ButtonSize.lg,
//   loading: isLoading,
//   onPressed: handleSubmit,
// )
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No types, hardcoded values, no accessibility, inline styles

function Button({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#007AFF',  // HARDCODED COLOR
        padding: 12,                 // HARDCODED SPACING
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16 }}>{title}</Text>
    </TouchableOpacity>
  );
}

// NO ACCESSIBILITY — screen readers cannot identify this button
// NO TYPE SAFETY — any prop value accepted silently
// INLINE STYLES — re-renders recreate style objects
// HARDCODED VALUES — breaks theming and dark mode
```

**Why this is bad:**
- Hardcoded colors break theming and dark mode.
- No accessibility — unusable for screen reader users.
- No TypeScript types — prop errors only caught at runtime.
- Inline styles cause unnecessary re-renders.
- No loading/disabled states — poor UX during async operations.

---

## 🚨 COMMON MISTAKES
1. **No accessibilityLabel for icon-only buttons** – Screen readers need explicit labels when visible text is absent.
2. **Passing new objects/arrays as props** – Causes re-renders even if data is identical. Use stable references when needed.
3. **Platform differences in shared components** – Use `Platform.OS` checks, not separate codebases.
4. **Prop drilling through 3+ levels** – Use context, composition, or render props instead.
5. **Premature memoization** – Adding `React.memo` everywhere without profiling shows benefit.
6. **Hardcoded theme values** – Using `Colors.light.primary` instead of semantic tokens from `useTheme()`.
7. **Feature components in shared directory** – Components used only in one feature should stay in `features/<name>/components/`.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] All props have TypeScript/Dart types with explicit interfaces.
- [ ] Component consumes theme tokens via `useTheme()` / `Theme.of(context)`, not hardcoded values.
- [ ] Accessibility is correct: role, label (when needed), state.
- [ ] Located in correct directory (`shared/components/` for reusable, `features/<name>/components/` for feature-specific).
- [ ] Each component in its own folder with types, styles, tests, and barrel export.
- [ ] No magic numbers — all values reference design tokens.
- [ ] Uses `Pressable` (RN) or `InkWell`/`Material` (Flutter) for interactive elements.
- [ ] Error boundary wraps feature zones (for RN).

---

## 📚 CHEATSHEET
| Pattern | When to Use | Example |
|---|---|---|
| Compound Components | Complex UI with flexible composition | `<Card><CardHeader/><CardContent/></Card>` |
| Design Tokens | All styling values | `colors.primary`, `spacing.md`, `radii.lg` |
| `useTheme()` | Access theme in components | `const { colors } = useTheme()` |
| `React.memo` | Frequent renders with stable props | `export const List = React.memo(ListImpl)` |
| `useMemo` | Expensive computation or referential stability | `const data = useMemo(() => compute(items), [items])` |
| `useCallback` | Stable handler reference for memoized children | `const onPress = useCallback(() => ..., [])` |
| Error Boundary | Feature zone crash isolation | `<ErrorBoundary><FeatureScreen /></ErrorBoundary>` |
| `Platform.OS` | Genuine platform differences | `Platform.OS === 'ios' ? iosStyle : androidStyle` |
| Semantics (Flutter) | Accessibility for custom widgets | `Semantics(button: true, label: 'Submit')` |

---

## 🔗 RELATED SKILLS
- ⬆️ [`mobile-project-structure`] – Directory layout where components live
- ⬇️ [`mobile-state-management`] – Components consume state from store
- ⬇️ [`mobile-api-integration`] – Components trigger API calls via hooks

---

## 📝 NOTES
- **React Native:** Use `Pressable` for new projects (better customization than `TouchableOpacity`).
- **Flutter:** Use `StatelessWidget` for stateless UI, `StatefulWidget` for animation/controllers, `const` constructors for performance.
- **Theme:** Always consume theme tokens via context/provider, never hardcoded `Colors.light.*`.
- **Compound:** Prefer composition over configuration props (`showHeader`, `showFooter`).
- **Performance:** Profile before optimizing. Do not add memoization by default.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Cross-Platform Edition
---
name: mobile-project-structure
description: Production-grade directory architecture for scalable cross-platform mobile apps (React Native, Expo, Flutter). Enforces feature-first organization, platform abstraction, typed configuration, navigation layer isolation, and environment-based configs.
---

# 📌 Mobile Project Structure

## 🎯 GOAL
**One sentence:** Modular, production-ready directory architecture for cross-platform mobile applications ensuring maintainability, testability, and horizontal feature scalability.

> Example:
> Standardized enterprise layout with feature-first organization, platform abstraction layers, and clear separation between presentation, domain logic, and data access — adapted for React Native/Expo or Flutter.

---

## 💡 KEY PRINCIPLES
- **Feature-First Organization** – Group code by domain feature, not by file type. Each feature contains its own screens, components, hooks, services, and types.
- **Layered Architecture** – Dependencies flow downward: Presentation → Domain → Data. Higher layers depend on abstractions, not implementations.
- **Platform Agnosticism** – Abstract platform-specific code behind shared interfaces so business logic works across iOS, Android, and web.
- **Strict Configuration Typing** – Environment variables are parsed, validated, and typed at build time — never accessed as raw strings.
- **Security-Aware Configuration** – Never embed secrets (API keys, passwords) in mobile apps. Use public configuration only.

---

## 🧠 ARCHITECTURE DECISION TREE

```
                    MOBILE PROJECT STRUCTURE
                              │
                 ┌────────────┴────────────┐
                 │                         │
          REACT NATIVE                  FLUTTER
          (TypeScript)                    (Dart)
                 │                         │
        ┌────────┴────────┐         ┌──────┴──────┐
        │                 │         │             │
      Expo              RN CLI    Flutter      Flutter
      Router                         flavors      web
        │                 │         │             │
   app/ (routes)      src/       lib/         lib/
   features/          features/  features/    features/
```

---

## 🏗️ SHARED PRINCIPLES (Both Platforms)

### Feature-First Structure
Each feature is self-contained with all related code co-located:

```
features/
├── auth/
│   ├── screens/          # Screen components for this feature
│   ├── components/       # Feature-specific UI components
│   ├── hooks/            # Business logic hooks / controllers
│   ├── services/         # Feature-specific services
│   ├── api/              # API calls for this feature
│   ├── store/            # Feature state (if needed)
│   └── types.ts          # Feature-specific types
│
├── profile/
├── payments/
└── notifications/
```

### Shared Infrastructure
Code that is reused across features lives in `shared/`:

```
shared/
├── components/           # Reusable UI primitives
│   ├── ui/              # Generic: Button, Input, Card, Text
│   ├── forms/           # Form-specific: DatePicker, Select
│   └── layout/          # Structural: Container, Spacer, Divider
├── hooks/               # Shared hooks (useTheme, useDebounce)
├── utils/               # Pure helper functions
├── constants/           # App-wide typed constants
├── styles/              # Theme definitions
├── types/               # Shared TypeScript/Dart types
└── api/                 # Base API client, interceptors
```

### Dependency Direction
```
screens/ → components/ → hooks/ → services/ → api/
     ↓           ↓           ↓           ↓
  (presentation)      (domain logic)    (data)
```

**Rules:**
- Screens can use components, hooks, services.
- Components should NOT import screens.
- Services should NOT import screens or components.
- API layer should NOT import UI layer.

---

## 📱 REACT NATIVE / EXPO STRUCTURE

### Standard React Native CLI

```
mobile_app/
├── src/
│   ├── app/                    # Entry point & navigation
│   │   ├── App.tsx             # Root component
│   │   ├── Navigation.tsx      # Root navigator
│   │   └── Routes.tsx          # Typed route constants
│   │
│   ├── features/               # Domain features (feature-first!)
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   └── LoginScreen.tsx
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── api/
│   │   │   │   └── authApi.ts
│   │   │   └── types.ts
│   │   ├── profile/
│   │   └── settings/
│   │
│   ├── shared/                 # Cross-feature infrastructure
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   └── layout/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── styles/
│   │   └── types/
│   │
│   ├── services/               # App-wide services
│   │   ├── AuthService.ts
│   │   └── NotificationService.ts
│   │
│   └── assets/                 # Static assets
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── __tests__/                  # Test infrastructure
├── .env.example                # Environment template (commit this)
├── tsconfig.json
├── package.json
└── metro.config.js
```

### Expo Router (File-Based Routing)

For Expo projects using Expo Router, the `app/` directory becomes the route tree:

```
mobile_app/
├── app/                        # Expo Router: route definitions ONLY
│   ├── _layout.tsx             # Root layout (providers)
│   ├── index.tsx               # Home route
│   ├── (tabs)/                 # Tab group
│   │   ├── _layout.tsx
│   │   ├── explore.tsx
│   │   └── profile.tsx
│   └── auth/                   # Auth route group
│       ├── login.tsx
│       └── register.tsx
│
├── features/                   # Feature implementation (NOT in app/)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types.ts
│   └── profile/
│
├── shared/                     # Reusable code
│   ├── components/
│   ├── hooks/
│   └── utils/
│
├── .env.example
├── app.json                    # Expo configuration
└── package.json
```

**Critical Rule:** Keep business logic OUT of `app/`. Routes should only:
1. Import screens/components from `features/`
2. Call hooks from `features/`
3. Navigate to other routes

---

## 🐦 FLUTTER STRUCTURE

### Standard Flutter Project

```
mobile_app/
├── lib/
│   ├── main.dart               # Entry point
│   │
│   ├── app/                    # App configuration & routing
│   │   ├── app.dart            # MaterialApp configuration
│   │   ├── routes.dart         # Route definitions (GoRouter)
│   │   └── theme.dart          # Theme configuration
│   │
│   ├── features/               # Domain features (feature-first!)
│   │   ├── auth/
│   │   │   ├── presentation/   # UI layer
│   │   │   │   ├── screens/
│   │   │   │   │   └── login_screen.dart
│   │   │   │   ├── widgets/
│   │   │   │   │   └── login_form.dart
│   │   │   │   └── cubit/      # or bloc/ or controller/
│   │   │   │       └── auth_cubit.dart
│   │   │   ├── domain/         # Business logic
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository.dart
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.dart
│   │   │   │   └── usecases/
│   │   │   │       └── login_usecase.dart
│   │   │   └── data/           # Data layer
│   │   │       ├── datasources/
│   │   │       │   └── auth_remote_datasource.dart
│   │   │       ├── models/
│   │   │       │   └── login_request.dart
│   │   │       └── repositories/
│   │   │           └── auth_repository_impl.dart
│   │   ├── profile/
│   │   └── settings/
│   │
│   ├── core/                   # Cross-feature infrastructure
│   │   ├── widgets/            # Reusable UI components
│   │   │   ├── buttons/
│   │   │   ├── inputs/
│   │   │   └── layouts/
│   │   ├── utils/              # Helper functions
│   │   ├── constants/          # Typed constants
│   │   ├── theme/              # Theme definitions
│   │   ├── network/            # Dio client, interceptors
│   │   └── types/              # Shared types
│   │
│   └── services/               # App-wide services
│       ├── auth_service.dart
│       └── notification_service.dart
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── flavors/                    # Build flavors
│   ├── development/
│   ├── staging/
│   └── production/
│
├── pubspec.yaml
├── build.yaml                  # build_runner config
└── analysis_options.yaml
```

### Flutter with Flavors

For different environments, use Flutter flavors:

```
mobile_app/
├── lib/
│   ├── main_development.dart
│   ├── main_staging.dart
│   └── main_production.dart
│
├── flavors/
│   ├── development/
│   │   └── config.dart         # Dev-specific config
│   ├── staging/
│   │   └── config.dart
│   └── production/
│       └── config.dart
│
└── pubspec.yaml
```

**Run with flavor:**
```bash
flutter run --flavor development --target lib/main_development.dart
```

---

## 🔧 BEST PRACTICES

### 1. Feature-First, Not Layer-First
**Wrong (layer-first):**
```
src/
├── screens/
├── components/
├── hooks/
├── services/
└── api/
```

**Correct (feature-first):**
```
src/
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── api/
│   └── profile/
├── shared/
└── app/
```

### 2. One Screen = One Folder
Each screen gets its own directory with component, styles, tests, and barrel export:

```
features/auth/screens/LoginScreen/
├── LoginScreen.tsx
├── LoginScreen.styles.ts
├── LoginScreen.test.tsx
└── index.ts              # Barrel export
```

### 3. Environment Configuration (Security-Aware)
**Public configuration (okay to embed):**
- `API_BASE_URL`
- `ENVIRONMENT` (dev/staging/prod)
- Feature flags
- App version

**NEVER embed in mobile app:**
- API secrets / private keys
- Database passwords
- Service credentials
- JWT secrets

**Use `.env.example` only** — actual values configured at build time:

```bash
# .env.example (commit this)
API_BASE_URL=https://api.example.com
ENVIRONMENT=development
FEATURE_FLAG_NEW_UI=false

# React Native: react-native-config
# Flutter: --dart-define or flavors
```

### 4. Navigation Isolation
Define all routes as typed constants. Never use string literals for navigation:

**React Native:**
```typescript
// src/app/Routes.tsx
export const Routes = {
  HOME: 'Home',
  PROFILE: 'Profile',
} as const;

export type RootStackParamList = {
  [Routes.HOME]: undefined;
  [Routes.PROFILE]: { userId: string };
};
```

**Flutter:**
```dart
// lib/app/routes.dart
class AppRoutes {
  static const home = '/home';
  static const profile = '/profile';
}

// Use GoRouter for type-safe routing
final _router = GoRouter(
  routes: [
    GoRoute(path: AppRoutes.home, builder: ...),
    GoRoute(path: '${AppRoutes.profile}/:userId', builder: ...),
  ],
);
```

### 5. Assets Under Version Control
- Keep asset file sizes small (optimize PNGs, use SVG/vector icons).
- Never commit raw screenshots or unoptimized media.
- Use `pubspec.yaml` (Flutter) or `metro.config.js` (RN) for asset configuration.

---

## ✅ CODE EXAMPLE (Correct) — React Native

```typescript
// File: src/app/Routes.tsx
export const Routes = {
  HOME: 'Home',
  PROFILE: 'Profile',
  LOGIN: 'Login',
} as const;

export type RootStackParamList = {
  [Routes.HOME]: undefined;
  [Routes.PROFILE]: { userId: string };
  [Routes.LOGIN]: undefined;
};

// File: src/features/auth/screens/LoginScreen/LoginScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Routes } from '../../../../app/Routes';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from '../../components/LoginForm';
import { styles } from './LoginScreen.styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading } = useAuth();

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials);
    navigation.navigate(Routes.HOME);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </View>
  );
}

// File: src/features/auth/hooks/useAuth.ts
import { useState } from 'react';
import { authApi } from '../api/authApi';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const user = await authApi.login(credentials);
      // Handle success
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
```

---

## ✅ CODE EXAMPLE (Correct) — Flutter

```dart
// File: lib/features/auth/presentation/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../cubit/auth_cubit.dart';
import '../widgets/login_form.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: BlocProvider(
        create: (_) => AuthCubit(repository: context.read()),
        child: const LoginForm(),
      ),
    );
  }
}

// File: lib/features/auth/domain/usecases/login_usecase.dart
class LoginUseCase {
  final AuthRepository _repository;

  LoginUseCase(this._repository);

  Future<User> execute(String email, String password) async {
    // Business logic validation
    if (email.isEmpty) throw InvalidEmailException();
    
    return _repository.login(email, password);
  }
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// File: App.tsx — 500+ lines, everything inline, no feature separation

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// EVERYTHING IN ONE FILE — NO SEPARATION
function App() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // DIRECT API CALL IN COMPONENT
    fetch('https://api.production.com/users/me')  // HARDCODED URL
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  // INLINE STYLES — NO REUSABILITY
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24 }}>Welcome!</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}  // STRING — NO TYPE
      >
        <Text>Go to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Why this is bad:**
- All code in one file — unmaintainable at scale.
- Hardcoded API URL — no environment config.
- No navigation types — string literals break silently.
- No feature separation — impossible to scale.
- Business logic mixed with UI — untestable.

---

## 🚨 COMMON MISTAKES
1. **Layer-first instead of feature-first** – Grouping by file type (`screens/`, `components/`) instead of by feature makes refactoring painful.
2. **Hardcoded environment URLs** – Use build-time config, never inline URLs.
3. **String navigation targets** – Always use typed route constants; typos cause silent runtime failures.
4. **Mixing business logic with UI** – Keep hooks/usecases separate from screens/widgets.
5. **Embedding secrets in app** – Never commit API keys or passwords to mobile apps.
6. **Flat screen directories** – Use per-screen folders with styles, tests, and barrel exports.
7. **Putting business logic in `app/` (Expo Router)** – Routes should only import from `features/`.
8. **No platform abstraction** – Platform-specific code should be behind shared interfaces.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Features are organized by domain, not by file type.
- [ ] Each screen has its own folder with styles, tests, and barrel export.
- [ ] Navigation uses typed route constants, not string literals.
- [ ] No hardcoded API URLs — uses environment config.
- [ ] No secrets embedded in code (API keys, passwords).
- [ ] `.env.example` is present (not actual `.env` files).
- [ ] Shared components live in `shared/`, not scattered across features.
- [ ] Platform-specific code is abstracted behind interfaces.
- [ ] (Flutter) Uses flavors for environment separation.
- [ ] (Expo Router) Business logic is in `features/`, not `app/`.

---

## 📚 CHEATSHEET
| Directory | Purpose | Key Pattern |
|---|---|---|
| `features/<name>/` | Domain feature | Contains screens, components, hooks, api, types |
| `shared/components/` | Reusable UI | `ui/`, `forms/`, `layout/` subdirectories |
| `shared/hooks/` | Shared logic | `use*` naming, return typed interfaces |
| `shared/utils/` | Pure helpers | No side effects, testable |
| `shared/constants/` | App-wide values | `as const` assertions, typed exports |
| `app/` (RN) | Entry & navigation | Root component, typed routes |
| `app/` (Expo) | Route definitions ONLY | Import from features, no business logic |
| `core/` (Flutter) | Infrastructure | Widgets, network, theme, types |

**Feature structure:**
```
features/auth/
├── screens/          # Screen components
├── components/       # Feature-specific UI
├── hooks/            # Business logic (RN)
├── presentation/     # UI layer (Flutter)
├── domain/           # Business rules (Flutter)
├── data/             # Data layer (Flutter)
├── api/              # API calls
├── services/         # Feature services
└── types.ts          # Feature types
```

---

## 🔗 RELATED SKILLS
- ⬇️ [`mobile-components-ui`] – Reusable UI primitives that live in `shared/components/`
- ⬇️ [`mobile-state-management`] – Store configuration and state management per feature
- ⬇️ [`mobile-api-integration`] – API client and endpoints in `features/<name>/api/`

---

## 📝 NOTES
- **React Native CLI:** Use `src/` with `features/` and `shared/` structure.
- **Expo Router:** `app/` is for route definitions only. Keep business logic in `features/`.
- **Flutter:** Use `lib/` with `features/` and `core/` structure. Use flavors for environments.
- **Configuration:** Use `.env.example` for documentation. Actual values configured at build time.
- **Security:** Never embed secrets in mobile apps. Use public configuration only.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Cross-Platform Edition
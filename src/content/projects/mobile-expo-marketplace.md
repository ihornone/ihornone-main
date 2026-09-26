---
title: "Expo Marketplace — мобільний маркетплейс"
category: "Мобільні застосунки"
icon: "fa-solid fa-store"
image: "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/cover-image.png"
description: "Практичний демонстраційний проєкт сучасного e-commerce маркетплейсу: каталог, живий кошик, авторизація та адаптивна тема."
type: "Мобільний застосунок (Практичний кейс)"
platform: "iOS / Android (React Native & Expo)"
technologies: "Expo, React Native, TypeScript, Firebase"
duration: "6 тижнів"
year: "2026"
role: "Мобільна розробка, архітектура, UI/UX"
github: "https://github.com/ihornone/expo-marketplace"
statusBadge: "Практичний проєкт (Демо e-commerce)"
pinned: true
order: 2
galleryFormat: "9:16"
features:
  - title: "Швидка авторизація"
    description: "Вхід через Email/Password та Google Sign-In з безпечним збереженням сесії на пристрої."
    icon: "fa-solid fa-key"
  - title: "Каталог і миттєвий пошук"
    description: "Live-пошук без затримок, фільтрація за категоріями, брендами, розмірами та діапазоном цін."
    icon: "fa-solid fa-magnifying-glass"
  - title: "Офлайн-кошик та чекаут"
    description: "Збереження товарів при розриві зв'язку, промокоди, вибір адреси та спосіб оплати."
    icon: "fa-solid fa-cart-shopping"
  - title: "Історія замовлень та статуси"
    description: "Відстеження руху посилки: активні, доставлені та скасовані покупки."
    icon: "fa-solid fa-clock-rotate-left"
  - title: "Кабінет покупця"
    description: "Керування особистими даними, збережені адреси доставки та способи розрахунку."
    icon: "fa-solid fa-user"
  - title: "Push-сповіщення та адаптивна тема"
    description: "Миттєві сповіщення про знижки та статус замовлення, підтримка нічного режиму."
    icon: "fa-solid fa-bell"
process:
  - step: 1
    title: "Аналіз мобільного e-commerce"
    description: "Дослідили інтерфейси провідних маркетплейсів для побудови зручного чекауту в 3 тапи."
  - step: 2
    title: "UI/UX проектування"
    description: "Розробили темну та світлу теми з урахуванням зон досяжності великого пальця на смартфонах."
  - step: 3
    title: "Розробка на React Native & Expo"
    description: "Реалізували компонентну архітектуру з типізацією TypeScript та валідацією форм через Zod."
  - step: 4
    title: "Інтеграція бекенду Firebase"
    description: "Підключили Firestore для синхронізації каталогу та Firebase Auth для безпечної авторизації."
  - step: 5
    title: "Профілювання продуктивності"
    description: "Оптимізували рендеринг важких списків товарів, досягнувши стабільних 60 FPS на бюджетних телефонах."
results:
  - value: "-50%"
    description: "економія витрат на розробку завдяки єдиному коду для iOS та Android"
  - value: "< 40 с"
    description: "середній час від пошуку товару до завершення чекауту в кошику"
  - value: "60 FPS"
    description: "плавність інтерфейсу та миттєвий відгук каталогу без підвисань"
  - value: "100%"
    description: "збереження кошика при раптовому зникненні інтернету"
gallery:
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/IndexScreen-dark.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/IndexScreen-light.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/ProductDetailsScreen-dark.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/ProductDetailsScreen-light.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/searchScreen-dark.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/FilterSheet-light.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/ProfileScreen-dark.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/SettingsScreen-light.jpg"
  - "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/LoginScreen-dark.jpg"
---

### Бізнес-завдання та мета розробки
Створення повноцінного мобільного маркетплейсу традиційно вважається однією з найдорожчих задач: зазвичай потрібні дві окремі команди розробників (Swift для iOS та Kotlin для Android), що роздуває бюджет у рази та відкладає реліз на пів року.

Цей проєкт був реалізований на практиці як демонстрація того, як за допомогою сучасного стеку **React Native + Expo** можна запустити повноцінний кросплатформний e-commerce MVP у стислі терміни та з економією до 50% бюджету.

### Ключові продуктивні рішення:
1. **Швидкість покупки:** Інтерфейс кошика та оформлення спроектований так, щоб клієнт міг здійснити покупку менш ніж за 40 секунд.
2. **Офлайн-надійність:** Якщо користувач зайшов у ліфт або метро і зв'язок обірвався, товари в кошику не зникають, а додаток зберігає стабільну роботу.
3. **Естетика та адаптивність:** Повна підтримка світлої та темної системних тем із плавною анімацією переходу та апаратним прискоренням жестів.

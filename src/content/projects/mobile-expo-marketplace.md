---
title: "Expo Marketplace — мобільний маркетплейс"
category: "Мобільні застосунки"
icon: "fa-solid fa-store"
image: "https://raw.githubusercontent.com/ihornone/expo-marketplace/refs/heads/main/assets/screenshots/cover-image.png"
description: "Кросплатформний маркетплейс на Expo з каталогом товарів, кошиком, оформленням замовлень та адаптивною темою."
type: "Мобільний застосунок"
platform: "iOS / Android (Expo)"
technologies: "Expo, React Native, TypeScript, Firebase"
duration: "6 тижнів"
year: "2026"
role: "Розробка, архітектура, UI/UX дизайн"
link: "https://github.com/ihornone/expo-marketplace"
github: "https://github.com/ihornone/expo-marketplace"
pinned: true
galleryFormat: "9:16"
features:
  - title: "Авторизація"
    description: "Вхід через Email/Password та Google Sign-In, збереження сесії."
    icon: "fa-solid fa-key"
  - title: "Каталог і пошук"
    description: "Live-пошук за назвою, брендом і тегами, фільтри за категорією, кольором та ціною."
    icon: "fa-solid fa-magnifying-glass"
  - title: "Кошик і оформлення замовлення"
    description: "Кошик у реальному часі, промокоди, вибір адреси та оплати."
    icon: "fa-solid fa-cart-shopping"
  - title: "Історія замовлень"
    description: "Активні, завершені та скасовані замовлення з статусами."
    icon: "fa-solid fa-clock-rotate-left"
  - title: "Профіль користувача"
    description: "Редагування даних, зміна пароля, збереження карти оплати, аватар."
    icon: "fa-solid fa-user"
  - title: "Push-сповіщення та адаптивна тема"
    description: "Сповіщення через Expo Push API, автоматична темна/світла тема, локалізація EN/UK."
    icon: "fa-solid fa-bell"
process:
  - step: 1
    title: "Архітектура"
    description: "Спроектували файлову маршрутизацію (Expo Router), структуру Firestore та контекстів стану."
  - step: 2
    title: "Дизайн"
    description: "Розробили адаптивну тему (dark/light) та UI-кит компонентів."
  - step: 3
    title: "Розробка"
    description: "Реалізували авторизацію, каталог, кошик, чекаут та профіль з валідацією через Zod."
  - step: 4
    title: "Інтеграції"
    description: "Підключили Firebase Auth, Firestore, Storage та Push-сповіщення."
  - step: 5
    title: "Тестування та реліз"
    description: "Перевірили сценарії на iOS та Android, зібрали білд через EAS Build."
results:
  - value: "20+"
    description: "екранів реалізовано в застосунку"
  - value: "2"
    description: "мови інтерфейсу — англійська та українська"
  - value: "8"
    description: "анімованих skeleton-станів завантаження"
  - value: "100%"
    description: "синхронізація даних у реальному часі через Firestore"
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

Expo Marketplace — це повноцінний кросплатформний маркетплейс, побудований на Expo SDK та Firebase. Застосунок покриває весь шлях користувача: онбординг, авторизацію, перегляд каталогу з фільтрами, кошик, чекаут та історію замовлень — усе в адаптивному інтерфейсі з підтримкою темної та світлої теми.

Проєкт побудований на файловій маршрутизації Expo Router, з реальним часом синхронізацією даних через Firestore, формами на react-hook-form + Zod та повною локалізацією українською та англійською мовами.

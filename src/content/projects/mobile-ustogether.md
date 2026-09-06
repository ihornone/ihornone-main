---
title: "UsTogether — трекер стосунків"
category: "Мобільні застосунки"
icon: "fa-solid fa-heart"
image: "https://raw.githubusercontent.com/ihornone/UsTogetherRNE/refs/heads/master/assets/screenshots/cover-image.png"
description: "Романтичний застосунок для пар, що рахує кожну секунду разом — з інтерактивним календарем-серцем."
type: "Мобільний застосунок"
platform: "iOS / Android (Expo)"
technologies: "Expo, React Native, TypeScript"
duration: "2 тижні"
year: "2026"
role: "Розробка, UI/UX дизайн"
github: "https://github.com/ihornone/UsTogetherRNE"
galleryFormat: "9:16"
features:
  - title: "Онбординг"
    description: "Тепле привітальне вікно з романтичним фоном та теглайном."
    icon: "fa-solid fa-hand-sparkles"
  - title: "Лічильник у реальному часі"
    description: "Секунди, хвилини, години, дні, тижні та місяці разом — оновлюються щосекунди."
    icon: "fa-solid fa-stopwatch"
  - title: "Інтерактивний календар-серце"
    description: "Місячна сітка з червоними серцями за дні разом, персиковими — за майбутні."
    icon: "fa-solid fa-calendar-heart"
  - title: "Налаштування дати"
    description: "Введення дня, місяця, року, години та хвилини початку стосунків із валідацією."
    icon: "fa-solid fa-sliders"
  - title: "Тактильний відгук"
    description: "М'яка haptic-вібрація при натисканні на вкладки (iOS)."
    icon: "fa-solid fa-mobile-screen-button"
  - title: "Тепла тема"
    description: "Коралово-червоний акцент на м'якому персиковому фоні по всьому застосунку."
    icon: "fa-solid fa-palette"
process:
  - step: 1
    title: "Концепція"
    description: "Придумали формат — живий лічильник часу разом та візуальний календар-серце."
  - step: 2
    title: "Дизайн"
    description: "Розробили теплу кольорову палітру та типографіку великих цифр для дашборду."
  - step: 3
    title: "Розробка"
    description: "Реалізували онбординг, домашній екран з лічильником та календар на Expo Router."
  - step: 4
    title: "Логіка та збереження"
    description: "Додали розрахунок статистики в реальному часі та збереження дати через AsyncStorage."
  - step: 5
    title: "Тестування та збірка"
    description: "Перевірили на iOS та Android, зібрали standalone-білд через EAS Build."
results:
  - value: "1 сек"
    description: "точність оновлення лічильника часу разом"
  - value: "6"
    description: "метрик часу на головному екрані одночасно"
  - value: "3"
    description: "екрани — онбординг, дашборд, календар, налаштування"
  - value: "100%"
    description: "офлайн-робота завдяки локальному збереженню даних"
gallery:
  - "https://raw.githubusercontent.com/ihornone/UsTogetherRNE/refs/heads/master/assets/screenshots/OnBoarding.jpg"
  - "https://raw.githubusercontent.com/ihornone/UsTogetherRNE/refs/heads/master/assets/screenshots/Home.jpg"
  - "https://raw.githubusercontent.com/ihornone/UsTogetherRNE/refs/heads/master/assets/screenshots/Calendar.jpg"
  - "https://raw.githubusercontent.com/ihornone/UsTogetherRNE/refs/heads/master/assets/screenshots/Settings.jpg"
---

UsTogether — невеликий, але дуже атмосферний застосунок для пар, який рахує кожну секунду стосунків: від хвилин і годин до тижнів і місяців. Головний екран показує живий дашборд зі статистикою, що оновлюється щосекунди, а календар відображає кожен місяць у вигляді сітки сердець — червоних за дні разом, персикових за майбутні, сірих за час до початку стосунків.

Застосунок повністю офлайн: дата початку стосунків зберігається локально через AsyncStorage, а вся логіка розрахунків — на клієнті, без бекенду. Простий, теплий і особистий проєкт, зроблений на Expo Router з акуратною типографікою та кольоровою палітрою.

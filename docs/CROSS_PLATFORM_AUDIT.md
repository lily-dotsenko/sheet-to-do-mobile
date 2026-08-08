# Кросплатформний аудит Sheet: to do 0.5.0

## Вихідний стан

Проєкт уже був застосунком Expo/React Native, а не нативним Kotlin/Java APK.
Android-збірка використовувала Expo CNG та EAS, тоді як iOS bundle identifier,
document type, build profile і notification behavior не були налаштовані.

Backend, API, авторизації, remote database та обов'язкових env-змінних не
виявлено. Застосунок є offline-first і зберігає дані лише в sandbox пристрою.

## 1. Використано без змін

- Expo Router, React components і responsive layout;
- domain models, immutable operations та migrations;
- `AppProvider` і локалізація;
- AsyncStorage та приватні JPEG через Expo FileSystem;
- picker, image compression, Sharing і DocumentPicker;
- `AppData v2`, storage keys і `.sheettodo` version 1;
- усі Android package identifiers та exact-alarm behavior.

## 2. Адаптовано

- iOS bundle identifier, build number, icon, photo permission і ATS;
- iOS UTI/MIME registration для `.sheettodo`;
- Notifee timestamp trigger, notification category і події натискання на iOS;
- EAS device, preview/ad hoc і Simulator profiles;
- iOS URI routing, testID, integration та E2E coverage;
- README, інсталяційні, технічні й data documents.

## 3. Замінено

Framework, UI та data layer не замінювалися. Android-only notification object
перетворено на один сервіс із вузькими платформними options. Push entitlement
прибрано з iOS build, оскільки застосунок використовує лише local notifications.

`expo-notifications` залишено тільки для скасування legacy Android notification
ID версії 0.3; нові Android та iOS reminders створює Notifee.

## 4. Ризики й обмеження

- iOS не підтримує примусовий full-screen alarm і нескінченний notification sound;
- Time Sensitive delivery залежить від дозволів, Focus і системних налаштувань;
- пряме відкриття `.sheettodo` залежить від MIME/UTI, який передає інша програма;
- безкоштовний Apple Personal Team потребує повторного підпису кожні 7 днів;
- native iOS compile та запуск неможливі без macOS/Xcode або EAS credentials;
- Android та iOS мають системні ліміти на кількість одночасних local triggers.

## 5. Обраний підхід

Збережено Expo Continuous Native Generation. Репозиторій містить спільний код,
Expo config, build profiles і функціональний config plugin, але не generated
`android/` чи `ios/`. Це мінімізує платформні розбіжності й дозволяє відтворити
Xcode/Gradle projects із конфігурації.

## Контрольна готовність

| Напрям                 | Стан                                                    |
| ---------------------- | ------------------------------------------------------- |
| Shared TypeScript code | готовий для Android та iOS                              |
| Android exact alarms   | збережено                                               |
| iOS local reminders    | Time Sensitive notification                             |
| Local storage          | спільний AsyncStorage/FileSystem layer                  |
| API/backend            | відсутні                                                |
| Unit/integration       | Jest                                                    |
| E2E                    | Maestro + physical device checklist                     |
| CI                     | format, lint, types, tests, Doctor, two-platform export |
| Store publication      | не налаштована й не потрібна                            |

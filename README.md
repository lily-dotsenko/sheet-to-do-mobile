# Sheet: to do

Офлайн-планер для Android та iPhone. Застосунок зберігає списки, завдання,
розклади й фотографії локально на пристрої. Обліковий запис, сервер, API та
підключення до інтернету для повсякденної роботи не потрібні.

## Можливості

- окремі списки з drag-and-drop сортуванням;
- завдання, прогрес і календар запланованих справ;
- локальні нагадування для списків і завдань;
- фотографії до завдань і власне фонове зображення;
- українська та англійська мови;
- чотири вбудовані теми;
- передавання списку як тексту або файла `.sheettodo` разом із фотографіями;
- імпорт через picker, deep link або відкриття `.sheettodo` в Android/iOS.

Android використовує точні Notifee alarms із повноекранним екраном і тривалим
звуком. iOS використовує системне Time Sensitive notification зі звуком і
кнопкою зупинки. iOS не дозволяє сторонньому застосунку примусово відкрити
full-screen alarm або нескінченно відтворювати notification sound.

## Технології

- Expo SDK 57, React Native 0.86 і React 19;
- Expo Router та Continuous Native Generation;
- TypeScript у strict-режимі;
- React Context для стану;
- AsyncStorage для versioned JSON;
- Expo FileSystem для приватних JPEG;
- Notifee для локальних Android/iOS notifications;
- Jest, ESLint, Prettier і Maestro.

Notifee є нативним модулем, тому повний застосунок не працює в Expo Go. Для
розробки потрібен development build або локальна native-збірка.

## Архітектура

```text
Screens / reusable components
              |
              v
AppProvider: state and side-effect orchestration
        |                   |
        v                   v
Domain models          Platform services
and migrations         storage, files, sharing, notifications
        \                   /
         v                 v
       AsyncStorage + private files + OS notification registry
```

Бізнес-логіка, моделі, валідація, стан, сховище, імпорт/експорт, дизайн-токени й
UI спільні для Android та iOS. Платформні відмінності обмежені notification
options, дозволами, file association і build/signing процесом.

## Структура

```text
src/app/          маршрути й екрани Expo Router
src/components/   повторно використовуваний UI
src/domain/       моделі, інваріанти, розклад і міграції
src/services/     сховище, файли, імпорт/експорт і notifications
src/state/        AppProvider і keyboard orchestration
src/theme/        теми та піктограми
assets/           іконки та фонові зображення
docs/             технічна й інсталяційна документація
.maestro/         E2E flows і device checklist
```

## Вимоги

Загальні:

- Node.js 22 LTS;
- npm;
- Git.

Для Android потрібні Android Studio, Android SDK і JDK або EAS Build. Для iOS
потрібні macOS, актуальний Xcode, CocoaPods і підключений iPhone; paid ad hoc
збірку також можна створити через EAS Build.

## Встановлення залежностей

```powershell
npm ci
```

Якщо `package-lock.json` свідомо оновлюється, використовуй `npm install`.

## Локальний запуск

Metro для development client:

```powershell
npm run dev
```

Android:

```powershell
npm run android
```

iOS на macOS:

```bash
npm run ios -- --device
```

Команда iOS генерує native-проєкт через CNG, встановлює pods і запускає збірку.
Каталоги `android/` та `ios/` генеруються локально й не зберігаються в Git.

## Перевірки

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run doctor
```

Перевірка платформних Metro/Hermes bundles:

```powershell
npx expo export --platform android --output-dir .expo-ci/android --clear
npx expo export --platform ios --output-dir .expo-ci/ios --clear
```

Maestro запускається на встановленому development/preview build:

```powershell
npm run test:e2e
```

Фізичні дозволи, photo picker, alarms і file association перевіряються за
[device checklist](.maestro/DEVICE_CHECKLIST.md). GitHub Actions виконує лише
непублікуючі перевірки без signing credentials.

## Android APK

Preview APK для прямого встановлення:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Локальний debug build створюється через `npm run android`. Інструкції з APK,
ADB, оновлення без втрати даних і signing наведені в
[docs/ANDROID_INSTALL.md](docs/ANDROID_INSTALL.md).

## iPhone

Для особистого iPhone підтримуються два варіанти:

1. безкоштовний Apple ID та локальна збірка через Xcode Personal Team;
2. платний Apple Developer Program та ad hoc IPA через Xcode або EAS.

Безкоштовний provisioning profile діє 7 днів, після чого застосунок потрібно
зібрати й встановити повторно. Ad hoc build працює лише на iPhone, UDID якого
внесено до provisioning profile. Повна інструкція: [docs/IOS_INSTALL.md](docs/IOS_INSTALL.md).

Жодна build-команда в цьому репозиторії не публікує застосунок у Google Play або
App Store. Команди `eas submit` у проєкті не використовуються.

## Дані, API та змінні середовища

Backend, віддаленого API, авторизації, токенів і серверної бази даних немає.
Обов'язкові змінні середовища відсутні.

Метадані зберігаються в AsyncStorage під ключем `sheet-to-do:data`. Фотографії та
власний фон лежать окремими JPEG у приватній document directory. Схема даних
залишається `AppData v2`, тому Android-оновлення з 0.4.0 не потребує міграції.

`.sheettodo` містить один список і доступні фотографії. Імпорт перевіряє версію,
розмір, структуру ZIP, безпечність шляхів, JPEG markers і CRC32. Видалення
застосунку очищає приватні дані; перед перевстановленням варто експортувати
важливі списки.

## Дозволи

Android запитує notifications і, для точного будильника, системний доступ
Alarms & reminders. iOS запитує notifications і доступ до вибраних фотографій.
Камера, мікрофон і геолокація не використовуються.

## Типові проблеми

- **Expo Go не запускає застосунок:** потрібен development build через Notifee.
- **Android alarm не спрацював:** перевір notifications, Alarms & reminders і
  battery optimization.
- **iOS notification без звуку:** перевір Notifications, Focus і Silent Mode;
  звичайний Time Sensitive alert не обходить усі системні обмеження.
- **Xcode не підписує build:** вибери правильний Team, унікальний bundle ID,
  увімкни automatic signing і Developer Mode на iPhone.
- **`.sheettodo` не відкривається напряму:** збережи файл у Files/Downloads і
  скористайся кнопкою імпорту в застосунку.
- **Дані зникли після reinstall:** uninstall очищає app sandbox; імпортуй раніше
  збережений `.sheettodo`.

## Документація

- [кросплатформний аудит](docs/CROSS_PLATFORM_AUDIT.md);
- [загально-технічна документація](docs/TECHNICAL_DOCUMENTATION.md);
- [локальна модель даних](docs/DATA_DOCUMENTATION.md);
- [встановлення Android](docs/ANDROID_INSTALL.md);
- [встановлення iOS](docs/IOS_INSTALL.md);
- [походження візуальних матеріалів](docs/ASSET_SOURCES.md).

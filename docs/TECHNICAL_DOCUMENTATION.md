# Sheet: to do — загально-технічна документація

Версія документа відповідає застосунку `0.4.0` та Expo SDK 57.

## Паспорт проєкту

| Аспект     | Рішення                                       |
| ---------- | --------------------------------------------- |
| Назва      | Sheet: to do                                  |
| Тип        | Нативний офлайн-планер для Android            |
| Платформа  | Android 7+; development/preview build         |
| Мови       | Українська та англійська                      |
| Runtime    | Expo SDK 57, React Native 0.86, React 19      |
| Навігація  | Expo Router, file-based routes                |
| Стан       | React Context + синхронний `dataRef`          |
| Зберігання | AsyncStorage і приватні файли Expo FileSystem |
| Сповіщення | Notifee, точні Android alarms                 |
| Мережа     | Не потрібна для роботи застосунку             |

### Мета й межі

Sheet: to do дає змогу вести незалежні списки, планувати їх у календарі,
прикріплювати фотографії та отримувати точні будильники без облікового запису,
сервера й хмарної синхронізації. Поточна версія має один локальний профіль,
експортує один список за раз і потребує native build: Notifee не працює у
звичайному Expo Go.

## Функціональні модулі

| Модуль      | Можливості                                    | Основні компоненти                |
| ----------- | --------------------------------------------- | --------------------------------- |
| Списки      | створення, видалення, drag-and-drop, прогрес  | `ListCard`, `DraggableFlatList`   |
| Завдання    | додавання, виконання, видалення, фото         | `TaskRow`, domain operations      |
| Календар    | місячна сітка та agenda                       | `CalendarGrid`, `/calendar`       |
| Будильники  | exact alarm, full-screen UI, тривалий звук    | Notifee, `/alarm`                 |
| Теми        | чотири фони та власний JPEG                   | `ThemePickerModal`, file store    |
| Передавання | текст і пакет `.sheettodo`                    | `native-transfer`, `list-package` |
| Імпорт      | picker, Android intent, legacy JSON/deep link | `/import-file`, `/import`         |
| Локалізація | українська/англійська, календар               | `translations`, `calendar-locale` |

## Архітектурна позиція

Застосунок є локальним mobile client без backend-рівня. UI викликає операції
`AppProvider`; domain-функції повертають новий незмінний `AppData`; сервісний шар
серіалізує metadata та керує файлами й alarms.

```text
Screens / Components
        |
        v
AppProvider (state, orchestration, notices)
        |
        +----> Domain (models, schedules, migrations)
        |
        +----> Services (storage, files, transfer, notifications)
                         |
                         v
        AsyncStorage / private JPEG / Android Notifee
```

| Рівень   | Відповідальність                                   | Приклади                              |
| -------- | -------------------------------------------------- | ------------------------------------- |
| UI       | введення, підтвердження, accessibility, navigation | screens, cards, modals                |
| State    | оркестрація та синхронізація React state           | `AppProvider`, notices, busy flags    |
| Domain   | інваріанти й immutable-оновлення                   | ліміти, CRUD, schedule helpers        |
| Services | I/O та інтеграція з платформою                     | storage, FileSystem, Sharing, Notifee |
| Android  | sandbox, picker, Share Sheet, alarms               | permissions та intent routing         |

## Маршрути й навігація

| Route          | Призначення                  | Параметри                         |
| -------------- | ---------------------------- | --------------------------------- |
| `/`            | головний екран зі списками   | —                                 |
| `/calendar`    | календар і agenda            | —                                 |
| `/alarm`       | екран активного будильника   | `notificationId`, `title`, `body` |
| `/import`      | сумісний імпорт із deep link | `data`                            |
| `/import-file` | підтвердження `.sheettodo`   | `uri`                             |

`+native-intent.tsx` переводить Android `content://` або `file://` URI на
`/import-file`. `AlarmNavigationHandler` відкриває `/alarm` після доставки або
натискання Notifee notification.

## Життєвий цикл стану

### Запуск

1. `AppStorage.load()` читає JSON із AsyncStorage.
2. `migrateStoredData()` перевіряє версію та нормалізує старі формати.
3. `scrubMissingFiles()` перевіряє task photos і custom background.
4. Очищений документ стає поточним `dataRef` і React state.
5. Пошкоджений payload резервується; застосунок запускається з порожніми даними.

### Зміна даних

1. Компонент викликає метод контексту.
2. Domain-функція повертає новий `AppData` й оновлює `updatedAt`.
3. `commit()` синхронно оновлює `dataRef` та React state.
4. Snapshot додається до послідовної AsyncStorage write queue.
5. Помилка збереження не блокує UI, але створює notice `saveError`.

Черга не дозволяє повільнішій старій операції перезаписати новіший стан.

## Списки та завдання

- максимум 100 списків і 500 завдань у кожному;
- назва списку — до 60, текст завдання — до 160 символів;
- порядок списків відповідає порядку елементів масиву;
- прогрес обчислюється як `completed / tasks.length` і не дублюється у storage;
- завершення task з активним alarm скасовує його та очищає schedule;
- невідомий `listId`/`taskId` дає no-op, а не аварійне завершення.

## Планування й будильники

Розклад є необов’язковою ISO-датою на рівні списку або завдання. Календар групує
записи за локальним ключем `YYYY-MM-DD`.

Для alarm застосунок перевіряє майбутній час, запитує notification permission,
на Android 12+ перевіряє `SCHEDULE_EXACT_ALARM` і створює Notifee timestamp trigger
типу `SET_ALARM_CLOCK`. Notification є ongoing, має loop sound, full-screen action
і кнопку зупинки. ID мають форму `list-{listId}` або `task-{taskId}`.

Під час перепланування попередній Notifee alarm скасовується. Для сумісності також
виконується спроба скасувати Expo Notifications ID, створений версією 0.3.

## Фотографії та теми

Системний picker не дає широкого доступу до медіатеки. Зображення стискається у
JPEG і копіюється до приватної document directory.

| Тип           | Каталог              | Максимальне ребро | JPEG quality |
| ------------- | -------------------- | ----------------: | -----------: |
| Фото завдання | `task-photos`        |           1600 px |         0.76 |
| Власний фон   | `custom-backgrounds` |           2400 px |         0.82 |

Видалення task/list очищає фото. Заміна фону видаляє попередній файл. Якщо task
видалено, поки picker відкритий, щойно створений JPEG також прибирається.

## Імпорт і експорт

Текстовий share містить назву, прогрес і checklist та призначений для читання.
`.sheettodo` є ZIP із `manifest.json` і JPEG у `photos/`; він переносить назву,
icon ID, текст, стан виконання та доступні фото. Розклади, notification IDs,
`createdAt` і власний фон не експортуються.

Імпорт перевіряє ZIP signature, path safety, дублікати, версію, розміри, JPEG
markers і CRC32. Нові list/task IDs генеруються завжди. Залишено читання legacy
JSON оригінальної вебверсії та deep links.

## Локалізація й адаптивність

Мова береться з preferences або locale пристрою (`uk`, інакше `en`). UI має
accessibility labels/roles, safe areas, keyboard avoiding behavior, локалізований
календар і одну або дві колонки при ширині від 760 px.

## Безпека та приватність

- застосунок не має сервера й не надсилає дані розробнику;
- metadata та JPEG лежать у приватному Android sandbox;
- окремого прикладного шифрування storage немає;
- `CAMERA`, `RECORD_AUDIO` і `SYSTEM_ALERT_WINDOW` заблоковані;
- import input проходить структурну перевірку;
- тимчасові exports видаляються в `finally`;
- uninstall видаляє приватні дані.

## Збірка та конфігурація

| Профіль       | Призначення             | Artifact     |
| ------------- | ----------------------- | ------------ |
| `development` | development client      | internal APK |
| `preview`     | ручне встановлення й QA | internal APK |
| `production`  | майбутня публікація     | AAB          |

Android permissions: `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`. Package ID:
`com.lilydotsenko.sheettodo`; scheme: `sheettodo`.

## Контроль якості

| Перевірка      | Команда                              | Призначення                          |
| -------------- | ------------------------------------ | ------------------------------------ |
| Formatting     | `npm run format:check`               | єдиний стиль                         |
| Lint           | `npm run lint`                       | Expo/React/TypeScript rules          |
| TypeScript     | `npm run typecheck`                  | strict type safety                   |
| Unit tests     | `npm test`                           | domain, migration, storage, transfer |
| Expo Doctor    | `npm run doctor`                     | сумісність SDK                       |
| Android bundle | `npx expo export --platform android` | Metro/Hermes resolution              |

Поточний набір містить 39 unit-тестів у 11 suites. Native UI та OS dialogs
потребують перевірки на реальному Android.

## Відомі обмеження та розвиток

| Напрям            | Поточний стан        | Можливий розвиток                  |
| ----------------- | -------------------- | ---------------------------------- |
| Синхронізація     | відсутня             | opt-in encrypted sync              |
| Backup            | один список          | пакет усіх lists/preferences/media |
| UI tests          | ручні                | integration/E2E tests              |
| Orphan cleanup    | очищення відомих URI | періодичний scan каталогів         |
| Alarm reliability | залежить від OEM     | diagnostics screen дозволів        |
| Accessibility     | базові labels/roles  | screen reader і dynamic type QA    |

## Карта вихідного коду

| Шлях             | Призначення                                  |
| ---------------- | -------------------------------------------- |
| `src/app`        | routes і screen orchestration                |
| `src/components` | повторно використовувані UI-блоки            |
| `src/domain`     | типи, інваріанти, міграції, schedule helpers |
| `src/state`      | App Context і keyboard scrolling             |
| `src/services`   | storage, files, transfer, notifications      |
| `src/i18n`       | переклади й календарна locale                |
| `src/theme`      | theme та icon registries                     |

## Підсумок

Sheet: to do має чіткий поділ UI, immutable domain, state orchestration і native
services. Архітектура мінімізує зовнішні залежності, зберігає дані на пристрої та
окремо захищає найризиковіші потоки: exact alarms, lifecycle JPEG і import
недовірених пакетів.

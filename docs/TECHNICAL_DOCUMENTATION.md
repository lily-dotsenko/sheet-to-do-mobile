# Sheet: to do — загально-технічна документація

Версія документа відповідає застосунку `0.5.0`, Expo SDK 57 та React Native 0.86.

## Паспорт проєкту

| Аспект         | Рішення                                           |
| -------------- | ------------------------------------------------- |
| Тип            | offline-first mobile planner                      |
| Платформи      | Android та iPhone                                 |
| Мови           | українська й англійська                           |
| UI runtime     | React Native 0.86, React 19                       |
| Platform layer | Expo SDK 57, CNG, EAS/Xcode/Gradle                |
| Навігація      | Expo Router, file-based routes                    |
| Стан           | React Context + synchronous `dataRef`             |
| Зберігання     | AsyncStorage і приватні Expo FileSystem files     |
| Сповіщення     | Notifee exact alarm / Time Sensitive notification |
| Мережа         | не потрібна для роботи застосунку                 |
| Backend/API    | відсутні                                          |

## Мета та межі

Sheet: to do дає змогу вести незалежні списки, планувати їх у календарі,
прикріплювати фотографії й отримувати локальні reminders без облікового запису,
сервера або cloud sync. Один installation sandbox є одним локальним профілем.

Платформи підтримуються в одному Expo-проєкті. Generated `android/` та `ios/`
відтворюються з `app.json` і не є джерелом істини в Git.

## Функціональні модулі

| Модуль      | Можливості                          | Реалізація                      |
| ----------- | ----------------------------------- | ------------------------------- |
| Списки      | CRUD, drag-and-drop, progress       | `ListCard`, domain functions    |
| Завдання    | CRUD, completion, task photos       | `TaskRow`, `AppProvider`        |
| Календар    | month grid та agenda                | `CalendarGrid`, `/calendar`     |
| Reminders   | list/task local schedule            | Notifee, `/alarm`               |
| Теми        | чотири фони та custom JPEG          | theme registry, file store      |
| Transfer    | text, JSON/deep link, `.sheettodo`  | transfer/package services       |
| Import      | picker, file association, deep link | `/import-file`, `/import`       |
| Локалізація | `uk`/`en`, calendar locale          | translations and locale helpers |

## Архітектурна позиція

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
      AsyncStorage / private JPEG / platform notification registry
```

| Рівень          | Відповідальність                                        |
| --------------- | ------------------------------------------------------- |
| UI              | input, confirmation, accessibility, responsive layout   |
| State           | orchestration, busy state, persistence calls, cleanup   |
| Domain          | schema, limits, validation, immutable transitions       |
| Services        | storage, files, archive parsing, sharing, notifications |
| Platform config | identifiers, permissions, UTI/MIME, signing profiles    |

Business logic, models, state, storage, transfer, theme tokens and components are
shared. Platform branching is limited to notification options, permissions and
native build configuration.

## Маршрути

| Route          | Призначення               | Параметри                    |
| -------------- | ------------------------- | ---------------------------- |
| `/`            | lists and tasks           | —                            |
| `/calendar`    | calendar and agenda       | —                            |
| `/alarm`       | active alarm screen       | notification ID, title, body |
| `/import`      | deep-link confirmation    | encoded `data`               |
| `/import-file` | `.sheettodo` confirmation | encoded file `uri`           |

`+native-intent.tsx` converts Android `content://` and Android/iOS `file://` URI
into `/import-file`. Scheme `sheettodo` handles compact JSON deep links. On iOS,
the exported UTI `com.lilydotsenko.sheettodo.list` associates `.sheettodo` with
the app.

Expo Router provides native stacks. Safe areas are applied to every full screen,
Android predictive back stays enabled and iOS uses the native edge-back gesture.

## Життєвий цикл даних

### Запуск

1. `AppStorage.load()` reads JSON from AsyncStorage.
2. `migrateStoredData()` validates or upgrades the stored shape.
3. `scrubMissingFiles()` checks task photos and custom background.
4. Clean data becomes current `dataRef` and React state.
5. Invalid raw payload is copied to the corrupt backup key and reset safely.

### Зміна

1. UI invokes an `AppProvider` operation.
2. A domain function returns a new `AppData` value.
3. `commit()` synchronously updates `dataRef` and React state.
4. Serialized snapshots enter the AsyncStorage write queue.
5. A failed write produces `saveError` without crashing the UI.

The write queue prevents a slower older snapshot from overwriting a newer one.

## Списки та завдання

- up to 100 lists and 500 tasks per list;
- list title: 1–60 characters;
- task text: 1–160 characters;
- progress is derived from completed tasks and is not stored separately;
- completing a task cancels and clears its reminder;
- unknown list/task IDs result in a safe no-op;
- imported aggregates always receive new IDs.

## Notifications

The stored schedule shape is platform-independent: `scheduledAt`, `alarmEnabled`
and `notificationId`. ID values follow `list-{id}` or `task-{id}`.

| Behavior         | Android                              | iOS                                  |
| ---------------- | ------------------------------------ | ------------------------------------ |
| Trigger          | exact timestamp + AlarmManager       | timestamp local notification         |
| Importance       | alarm channel, high                  | Time Sensitive                       |
| Sound            | default, looping                     | default system sound                 |
| Presentation     | ongoing + full-screen action         | banner/list notification             |
| Stop             | notification action and alarm screen | notification action and alarm screen |
| Extra permission | exact alarms on Android 12+          | none beyond notifications            |

`configureNotifications()` creates the Android channel or iOS action category.
`scheduleReminder()` validates future time and requests platform permission. The
Android-only AlarmManager object is never passed to the iOS trigger.

On Android, `getInitialNotification()` handles cold-start navigation. On iOS,
Notifee `PRESS` events open `/alarm`; `DELIVERED` opens the screen only while the
application is in foreground. Background stop actions run from the early handler
registered in `index.ts`.

iOS intentionally does not request Critical Alert entitlement. It cannot match
Android full-screen/looping behavior because that capability is restricted by the
operating system.

`expo-notifications` remains a compatibility dependency only for cancelling old
Android notification IDs produced by version 0.3. New reminders use Notifee.

## Images and themes

ImagePicker gives access only to user-selected media. Selected content is resized,
compressed as JPEG and copied into the private document directory.

| Type              | Directory            | Maximum edge | JPEG quality |
| ----------------- | -------------------- | -----------: | -----------: |
| Task photo        | `task-photos`        |      1600 px |         0.76 |
| Custom background | `custom-backgrounds` |      2400 px |         0.82 |

Deletion and replacement clean managed files. Startup removes metadata references
to missing files. If a task disappears while the picker is open, the newly copied
file is removed instead of becoming an orphan.

## Import and export

Text share is human-readable. `.sheettodo` is a ZIP containing `manifest.json`
and JPEG files under `photos/`. It transfers one list, task completion state and
available photos; schedules, notification IDs, creation timestamps and custom
background are not exported.

The parser validates format, version, archive size, entry count, path safety,
duplicates, JPEG markers, declared sizes and CRC32. Legacy web JSON, older ZIP
packages and compact deep links remain readable.

Temporary export files are created under cache and deleted in `finally`. A package
photo import is compensating: if a later write fails, earlier imported files are
removed.

## UX and adaptive layout

- safe-area containers protect notches and home indicator;
- `KeyboardAvoidingView` uses iOS padding and Android resized height;
- focused task inputs are measured and scrolled above the keyboard;
- one list column is used below 760 px and two above it;
- cards and dialogs have bounded widths for large screens;
- stable accessibility labels, roles and E2E `testID` values are present;
- the app keeps a light system shell and offers four visual background themes.

System dark mode is not introduced in 0.5.0 because the Android behavior being
preserved did not provide it.

## Security and privacy

- no backend, analytics, remote API, auth or tokens;
- no required environment variables;
- no app-level encryption for AsyncStorage;
- import is treated as untrusted input;
- ATS disallows arbitrary HTTP; local networking remains available for dev builds;
- camera, microphone and geolocation are not requested;
- push entitlement is removed because only local notifications are used;
- signing keys, certificates and provisioning profiles are ignored by Git.

Data leaves the device only after the user invokes Share/Export. Uninstall removes
the private app sandbox.

## Build configuration

| Profile                 | Android         | iOS                             | Purpose                        |
| ----------------------- | --------------- | ------------------------------- | ------------------------------ |
| `development`           | internal APK    | signed device development build | native debugging               |
| `development-simulator` | —               | Simulator development build     | unsigned Simulator QA          |
| `preview`               | installable APK | ad hoc IPA                      | personal/internal installation |
| `production`            | AAB             | store-signed archive            | retained, not submitted        |

Application version is `0.5.0`; Android package and iOS bundle identifier are
`com.lilydotsenko.sheettodo`. Android `versionCode` and iOS `buildNumber` are `5`.
No `submit` profile or automated store publication exists.

## Quality control

| Check              | Command                              |
| ------------------ | ------------------------------------ |
| Formatting         | `npm run format:check`               |
| Lint               | `npm run lint`                       |
| TypeScript         | `npm run typecheck`                  |
| Unit tests         | `npm test`                           |
| Integration        | `npm run test:integration`           |
| Expo compatibility | `npm run doctor`                     |
| Android bundle     | `npx expo export --platform android` |
| iOS bundle         | `npx expo export --platform ios`     |
| Device E2E         | `npm run test:e2e`                   |

The repository contains 43 Jest tests in 13 suites, including notification
configuration, iOS URI routing and an offline storage/export/import restart flow.
Maestro covers core UI persistence, navigation/theme and deep-link import.

Native permissions, photo picker, OS share sheets, exact alarm and Time Sensitive
delivery require the physical-device matrix in `.maestro/DEVICE_CHECKLIST.md`.

GitHub Actions runs non-signing checks and both platform exports. It does not build
or publish store artifacts and does not access signing credentials.

## Directory map

| Path             | Role                                    |
| ---------------- | --------------------------------------- |
| `src/app`        | screens and routes                      |
| `src/components` | reusable UI                             |
| `src/domain`     | models, schedule helpers, migrations    |
| `src/services`   | storage, files, transfer, notifications |
| `src/state`      | application state orchestration         |
| `src/theme`      | themes and icon registry                |
| `plugins`        | reproducible native configuration       |
| `.maestro`       | E2E flows and device checklist          |
| `docs`           | install, technical and data documents   |

## Known limitations

- no cloud sync or multi-device merge;
- `.sheettodo` transfers one list per file;
- custom backgrounds are not included in list backup;
- local notification delivery depends on OS settings;
- iOS Personal Team builds expire after 7 days;
- a native iPhone build requires macOS/Xcode or paid EAS signing;
- direct file opening depends on the source application's MIME/UTI behavior.

## Conclusion

Version 0.5.0 extends the existing Android application to iPhone without a
framework rewrite. Shared TypeScript remains the source of product behavior, while
platform-specific configuration is limited, explicit and reproducible.

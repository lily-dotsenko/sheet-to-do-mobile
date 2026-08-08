# Sheet: to do — документація локальної моделі даних

Версія документа відповідає формату даних `2` і застосунку `0.4.0`.

## Паспорт моделі

| Аспект          | Рішення                                    |
| --------------- | ------------------------------------------ |
| Persistence     | локальне document-oriented сховище без SQL |
| Метадані        | один versioned JSON у AsyncStorage         |
| Великі об’єкти  | JPEG у приватній document directory        |
| Transfer format | ZIP-контейнер `.sheettodo`                 |
| Версія          | `DATA_VERSION = 2`                         |
| Основний ключ   | `sheet-to-do:data`                         |
| Аварійна копія  | `sheet-to-do:data:corrupt`                 |
| Запис           | послідовна promise queue в межах процесу   |
| Серверна БД     | відсутня                                   |

### Важливе уточнення

Проєкт не використовує PostgreSQL, SQLite або іншу реляційну СУБД. «Сутності» й
«ключі» нижче — це TypeScript-структури та ID усередині JSON. Фізично metadata
записується одним документом, а JPEG зберігаються окремо.

## Логічна карта

```text
AsyncStorage: sheet-to-do:data
              |
              v
           AppData v2
          /          \
   TaskList[]     AppPreferences
       |               |
     Task[]       customBackground ---> custom-backgrounds/*.jpg
       |
     photo ---------------------------> task-photos/*.jpg

.sheettodo = manifest.json + photos/NNNN.jpg
```

AsyncStorage є source of truth для зв’язків і preferences. FileSystem містить
бінарні об’єкти, на які JSON посилається через `file://` URI. Notification IDs
посилаються на Android/Notifee registry.

## Ключові кардинальності

| Зв’язок                  | Кардинальність | Семантика                              |
| ------------------------ | -------------- | -------------------------------------- |
| AppData — TaskList       | 1:0..100       | упорядковані списки локального профілю |
| TaskList — Task          | 1:0..500       | task належить одному list              |
| Task — PhotoAttachment   | 1:0..1         | один приватний JPEG                    |
| Preferences — Background | 1:0..1         | один власний фон установки             |
| TaskList — Alarm         | 1:0..1         | активний list reminder                 |
| Task — Alarm             | 1:0..1         | активний task reminder                 |
| `.sheettodo` — TaskList  | 1:1            | пакет переносить один новий list       |
| Manifest task — Photo    | 1:0..1         | descriptor має унікальний JPEG path    |

## Сутність AppData

| Поле          | TypeScript type  | Required | Призначення                  |
| ------------- | ---------------- | -------- | ---------------------------- |
| `version`     | literal `2`      | так      | parser/migration path        |
| `lists`       | `TaskList[]`     | так      | до 100 упорядкованих списків |
| `preferences` | `AppPreferences` | так      | theme, background, language  |
| `updatedAt`   | ISO string       | так      | час останньої domain-зміни   |

`version` має точно дорівнювати поточній після міграції. Дати проходять
`Date.parse`; помилка вкладеної обов’язкової структури відхиляє весь payload.

## Сутність AppPreferences

| Поле               | Тип                    | Null | Правило                                  |
| ------------------ | ---------------------- | ---- | ---------------------------------------- |
| `themeId`          | `ThemeId`              | ні   | `twilight`, `winter`, `spring`, `autumn` |
| `customBackground` | `LocalImageAttachment` | так  | перекриває вбудований theme image        |
| `language`         | `Language`             | так  | `uk`, `en` або locale пристрою           |

Вибір вбудованої theme очищає custom background і видаляє попередній файл.
Background не входить до `.sheettodo`.

## Сутність TaskList

| Поле             | Тип        | Null | Правило                                   |
| ---------------- | ---------- | ---- | ----------------------------------------- |
| `id`             | string     | ні   | локальний ID, до 100 символів при читанні |
| `title`          | string     | ні   | trimmed, 1–60 символів                    |
| `iconId`         | string     | ні   | registry key, до 40 символів              |
| `tasks`          | `Task[]`   | ні   | до 500 записів                            |
| `scheduledAt`    | ISO string | так  | запланований час list                     |
| `alarmEnabled`   | boolean    | ні   | фактична наявність active alarm           |
| `notificationId` | string     | так  | ID нативного notification                 |
| `createdAt`      | ISO string | ні   | час створення                             |

Progress обчислюється з `completed`, а не зберігається. Unknown `iconId` безпечно
показується як `general`. Видалення list очищає task photos і всі alarms.

## Сутність Task

| Поле             | Тип               | Null | Правило                                   |
| ---------------- | ----------------- | ---- | ----------------------------------------- |
| `id`             | string            | ні   | локальний ID, до 100 символів при читанні |
| `text`           | string            | ні   | trimmed, 1–160 символів                   |
| `completed`      | boolean           | ні   | стан checkbox                             |
| `photo`          | `PhotoAttachment` | так  | посилання на private JPEG                 |
| `scheduledAt`    | ISO string        | так  | запланований час task                     |
| `alarmEnabled`   | boolean           | ні   | фактична наявність active alarm           |
| `notificationId` | string            | так  | ID нативного notification                 |
| `createdAt`      | ISO string        | ні   | час створення                             |

Завершення task з alarm скасовує reminder і schedule. Schedule може існувати без
alarm, тому запис відображається в календарі без дзвінка.

## Сутність LocalImageAttachment

`PhotoAttachment` є alias цієї структури.

| Поле       | Тип     | Правило                                      |
| ---------- | ------- | -------------------------------------------- |
| `uri`      | string  | непорожній `file://`, максимум 1000 символів |
| `width`    | number  | finite, більше нуля                          |
| `height`   | number  | finite, більше нуля                          |
| `mimeType` | literal | тільки `image/jpeg`                          |

Реальна наявність файлу перевіряється окремо через Expo FileSystem.

## Контрольовані значення

| Тип               | Значення                                                                                            | Застосування               |
| ----------------- | --------------------------------------------------------------------------------------------------- | -------------------------- |
| `Language`        | `uk`, `en`                                                                                          | preferences/localization   |
| `ThemeId`         | `twilight`, `winter`, `spring`, `autumn`                                                            | theme registry             |
| `mimeType`        | `image/jpeg`                                                                                        | local/package photos       |
| `ImportErrorCode` | `invalidJson`, `invalidFormat`, `unsupportedVersion`, `tooLarge`, `invalidArchive`, `unsafeArchive` | стабільні import errors    |
| Package format    | `sheet-to-do-package`                                                                               | manifest signature         |
| Package version   | `1`                                                                                                 | `.sheettodo` compatibility |

`iconId` залишається рядком для backward/forward compatibility.

## Фізичне розміщення

| Дані              | Місце                                   | Формат                    |
| ----------------- | --------------------------------------- | ------------------------- |
| Основний document | AsyncStorage `sheet-to-do:data`         | UTF-8 JSON                |
| Аварійна копія    | AsyncStorage `sheet-to-do:data:corrupt` | raw string                |
| Task photos       | document `/task-photos/`                | `task-{id}.jpg`           |
| Custom background | document `/custom-backgrounds/`         | `background-{id}.jpg`     |
| Тимчасовий export | cache `/exports/`                       | JSON або `.sheettodo`     |
| Picker copy       | DocumentPicker cache URI                | видаляється після читання |

Керовані file stores приймають для delete/read лише URI всередині свого каталогу.

## Читання, запис і recovery

### Читання

1. AsyncStorage повертає string або `null`.
2. `JSON.parse` створює unknown value.
3. `migrateStoredData` перевіряє та приводить його до v2.
4. `scrubMissingFiles` перевіряє всі локальні URI.
5. За потреби очищений document зберігається повторно.

### Запис

`AppStorage.save()` серіалізує snapshot одразу, а `setItem` ставить у promise queue.
Навіть після помилки попереднього запису наступний продовжує чергу.

### Пошкоджений payload

Raw string копіюється до corrupt key, основний key видаляється, а застосунок
створює порожній v2 і повідомляє користувача. Це availability-first стратегія;
часткового автоматичного відновлення окремих lists немає.

## Міграції

| Вхід         | Розпізнавання            | Перетворення                      |
| ------------ | ------------------------ | --------------------------------- |
| Legacy array | root є array             | legacy lists → AppData v2         |
| Legacy/v0    | version відсутня або `0` | theme/icon maps, current defaults |
| v1           | `version === 1`          | додає `customBackground: null`    |
| v2           | `version === 2`          | повна validation                  |
| Unknown      | інше                     | `MigrationError` і recovery       |

Legacy Bootstrap icon IDs і theme IDs мапляться на current registries. Browser
base64 photos не мігруються, бо синхронна міграція не створює durable files.

## Життєвий цикл файлів

| Подія                    | Metadata               | Файл                          |
| ------------------------ | ---------------------- | ----------------------------- |
| Вибір task photo         | attachment додається   | JPEG створюється              |
| Видалення photo          | `photo = null`         | managed JPEG видаляється      |
| Видалення task/list      | record прибирається    | JPEG видаляються best effort  |
| Новий background         | attachment замінюється | старий JPEG видаляється       |
| Picker cancelled         | без змін               | файл не створюється           |
| Task зник під час picker | без змін               | новий JPEG одразу видаляється |
| Файл відсутній           | attachment очищається  | missing file ігнорується      |

File errors не блокують видалення логічного record. Повного scan для orphan files
у поточній версії немає.

## Формат `.sheettodo`

```text
list-name.sheettodo
  manifest.json
  photos/0001.jpg
  photos/0002.jpg
```

Дозволені тільки `manifest.json` і `photos/[0-9]{4}.jpg`. Path traversal,
duplicate entries та unreferenced files відхиляються.

### PackageManifest

| Поле             | Тип             | Призначення           |
| ---------------- | --------------- | --------------------- |
| `format`         | literal         | `sheet-to-do-package` |
| `version`        | literal         | `1`                   |
| `exportedAt`     | ISO string      | час export            |
| `list.title`     | string          | до 60 символів        |
| `list.iconId`    | string          | до 40 символів        |
| `list.tasks[]`   | array           | до 500 snapshots      |
| `task.text`      | string          | до 160 символів       |
| `task.completed` | boolean         | стан виконання        |
| `task.photo`     | descriptor/null | package JPEG          |

### Photo descriptor

| Поле              | Правило                 |
| ----------------- | ----------------------- |
| `path`            | `photos/NNNN.jpg`       |
| `width`, `height` | `0 < value <= 10000`    |
| `mimeType`        | `image/jpeg`            |
| `byteSize`        | safe integer, 1..8 MiB  |
| `crc32`           | 8 lowercase hex symbols |

Import створює нові IDs і `createdAt`. Якщо save будь-якого photo падає, уже
створені JPEG очищаються.

## Ліміти й захист імпорту

| Обмеження          |        Значення | Мета                |
| ------------------ | --------------: | ------------------- |
| Archive            |          64 MiB | memory/I/O limit    |
| Uncompressed total |          80 MiB | zip bomb protection |
| Manifest           | 1,000,000 bytes | JSON parser limit   |
| Один photo         |           8 MiB | memory/file limit   |
| Photos             |             200 | entry count limit   |
| Tasks              |             500 | domain limit        |
| JSON import        | 1,000,000 chars | parser limit        |
| Deep link          |    50,000 chars | safe route size     |

Parser також перевіряє ZIP signature, duplicate paths, sizes, CRC32 і JPEG
SOI/EOI markers.

## Ідентифікатори й зв’язки

`createId()` поєднує timestamp у base36 та random suffix. Cryptographic uniqueness
не гарантується. Зв’язок list → task задається вкладеністю, не `task.listId`:

- task не належить двом lists;
- видалення list природно видаляє вкладені records;
- пошук task потребує `listId` і `taskId`;
- package import створює нову aggregate structure.

## Видалення та історія

- lists/tasks видаляються фізично; recycle bin і soft delete відсутні;
- completed tasks зберігаються до ручного видалення;
- schedule/notification history не ведеться;
- uninstall очищає AsyncStorage і private JPEG;
- `.sheettodo` є backup, але не журналом змін;
- corrupt key містить останній payload, який не вдалося прочитати.

## Розподіл відповідальності

| Рівень         | Відповідальність                      | Приклади                            |
| -------------- | ------------------------------------- | ----------------------------------- |
| Domain         | schema, ліміти, immutable transitions | models, migrations                  |
| AppProvider    | metadata + side effects               | commit, cleanup, alarm cancellation |
| AppStorage     | JSON persistence/write ordering       | load/save/recovery                  |
| File stores    | compression, managed URI, CRUD        | photos/backgrounds                  |
| Package parser | validation untrusted input            | paths, sizes, CRC, schema           |
| Android        | sandbox і notification registry       | document directory, alarms          |

Між JSON і FileSystem немає спільної ACID-транзакції. Код компенсує це порядком
операцій, cleanup у `catch/finally` та startup scrub.

## Безпека і приватність

- дані не залишають пристрій без Share/Export;
- AsyncStorage не шифрується прикладним ключем;
- package import вважається недовіреним input;
- `.sheettodo` не має encryption або digital signature;
- CRC32 виявляє пошкодження, але не підтверджує автора;
- cache exports видаляються після Share Sheet.

## Напрями розвитку

| Напрям              | Цінність                                    |
| ------------------- | ------------------------------------------- |
| Full backup         | один пакет для всіх lists/preferences/media |
| Fuzz tests          | жорсткіша перевірка migrations і ZIP parser |
| Orphan collector    | scan та видалення непосиланих JPEG          |
| Encrypted export    | пароль або public-key recipient             |
| Strong integrity    | cryptographic hash/signature                |
| SQLite/journal      | atomic snapshots при зростанні даних        |
| Conflict-aware sync | майбутня opt-in sync                        |

## Актуалізована концептуальна схема

| Рівень   | Сутність               | Логічний ключ         | Посилання                       |
| -------- | ---------------------- | --------------------- | ------------------------------- |
| Metadata | `AppData`              | singleton storage key | lists, preferences              |
| Metadata | `TaskList`             | `id`                  | contains Task[], optional alarm |
| Metadata | `Task`                 | `id` within list      | optional photo/alarm            |
| Metadata | `AppPreferences`       | singleton field       | optional background             |
| Metadata | `LocalImageAttachment` | `uri`                 | managed JPEG                    |
| File     | Task photo             | file URI              | `Task.photo`                    |
| File     | Background             | file URI              | preferences                     |
| Transfer | `PackageManifest`      | format + version      | one list snapshot               |
| Transfer | Photo descriptor       | archive path          | one manifest task               |
| External | Notifee alarm          | notification ID       | list/task schedule              |

## Підсумок

Модель є versioned aggregate для офлайн-застосунку: JSON зберігає структуру,
private JPEG — великі об’єкти, `.sheettodo` — контрольований transfer format.
Міграції, write queue, startup scrub і жорсткий parser компенсують відсутність SQL
constraints та спільної транзакції між metadata і файлами.

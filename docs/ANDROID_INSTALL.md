# Встановлення Sheet: to do на Android

## Який файл потрібен

Для прямого встановлення потрібен файл із розширенням `.apk`. Файл `.aab` призначений
для Google Play і напряму на телефон не встановлюється. Для цього проєкту використовуй
EAS-профіль `preview`:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Очікувана назва локальної копії: `dist/sheet-to-do-0.1.0.apk`.

## Перевірена збірка 0.1.0

- EAS build ID: `9d506d0e-aca6-4b3b-ae56-63db8b6b628a`;
- профіль: `preview`, Android internal distribution APK;
- [сторінка завершеної EAS-збірки](https://expo.dev/accounts/sugar4vaders-team/projects/sheet-to-do/builds/9d506d0e-aca6-4b3b-ae56-63db8b6b628a);
- локальний файл: `dist/sheet-to-do-0.1.0.apk`;
- розмір: `107466577` байтів (приблизно 102,49 MiB);
- SHA-256: `F9CCE15A0448E965F9153EACB1CF90D2953AC1C9743C476A4E2E6F896CA298A8`.

APK не зберігається в Git. Доступність artifact на EAS обмежена строком зберігання
internal build, тому для довготривалої передачі використовуй локальну копію та звіряй
її checksum.

## Перевірка файла перед передачею

На комп’ютері обчисли SHA-256:

```powershell
Get-FileHash dist\sheet-to-do-0.1.0.apk -Algorithm SHA256
```

Передавай checksum окремо від APK. Після копіювання можна повторно обчислити SHA-256
будь-яким перевіреним Android file hash tool і звірити 64 шістнадцяткові символи.

## Передача на телефон

Підійде Telegram як файл, Google Drive, USB, Nearby Share/Quick Share або SD-картка.
Не перейменовуй розширення й не розпаковуй APK.

## Дозвіл на встановлення

1. Відкрий завантажений APK.
2. Android покаже, яка програма намагається відкрити файл: Files, Drive, Telegram тощо.
3. Якщо з’явиться блокування, відкрий запропоновані налаштування й увімкни **Дозволити
   з цього джерела** тільки для цієї програми.
4. Повернись до файла й натисни **Встановити**.
5. Після успішного встановлення вимкни дозвіл для джерела, якщо він більше не потрібен.

Назви пунктів можуть трохи відрізнятися у Samsung One UI, Xiaomi HyperOS, Pixel Android
та інших оболонках.

## Встановлення через USB/ADB

Якщо Android platform-tools уже встановлено, увімкни USB debugging, під’єднай телефон і
виконай:

```powershell
adb devices
adb install dist\sheet-to-do-0.1.0.apk
```

Для оновлення поверх наявної версії:

```powershell
adb install -r dist\sheet-to-do-0.1.0.apk
```

## Оновлення без втрати даних

Новий APK повинен мати:

- package `com.lilydotsenko.sheettodo`;
- той самий Android signing key;
- більший `android.versionCode`;
- підтримувану міграцію локального формату.

Встанови його поверх старого. Не видаляй застосунок перед оновленням: uninstall видаляє
AsyncStorage і локальні фотографії. Перед ризиковим оновленням експортуй важливі списки
у JSON.

## Типові помилки

- **“App not installed”** — APK підписаний іншим ключем, versionCode зменшився, файл
  пошкоджено або пристрій не підтримує потрібну версію Android.
- **“Problem parsing the package”** — передано не APK, завантаження обірвалося або файл
  було змінено; звір SHA-256 і завантаж знову.
- **Заблоковано Play Protect** — переконайся, що APK отримано з власної EAS-збірки та
  checksum збігається; не обходь попередження для невідомих файлів.
- **Списки зникли після reinstall** — uninstall очищає приватні дані. Імпортуй раніше
  експортовані JSON-файли; фотографії transfer-файл не містить.

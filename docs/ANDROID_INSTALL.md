# Встановлення Sheet: to do на Android

## Варіанти збірки

Локальний debug build через Android SDK:

```powershell
npm ci
npm run android
```

Expo CNG створить `android/`, збере debug APK і встановить його на підключений
пристрій або емулятор. Generated native directory не додається до Git.

Preview APK через EAS для прямого встановлення:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Profile `preview` створює `.apk`, а не `.aab`. Команда запускає internal build і
нічого не публікує у Google Play.

## Signing

Для оновлення поверх попередньої версії APK повинен мати:

- package `com.lilydotsenko.sheettodo`;
- той самий signing key;
- `versionCode`, більший за встановлений.

Версія 0.5.0 використовує `versionCode 5`. EAS може безпечно зберігати Android
keystore. Якщо signing керується локально, не додавай до Git `.jks`, `.keystore`,
`credentials.json`, паролі або локальний `gradle.properties` із секретами.

## Встановлення файла

1. Передай APK через USB, Drive, месенджер або інший контрольований канал.
2. Відкрий файл на Android.
3. Дозволь установлення з цього джерела лише для програми, яка відкрила APK.
4. Перевір назву **Sheet: to do** і підтвердь встановлення.
5. Після завершення дозвіл для невідомих застосунків можна вимкнути.

Оболонки Samsung, Xiaomi, Huawei та інших виробників називають ці пункти трохи
по-різному.

## USB та ADB

```powershell
adb devices
adb install path\to\sheet-to-do-0.5.0.apk
```

Оновлення поверх наявної версії:

```powershell
adb install -r path\to\sheet-to-do-0.5.0.apk
```

Не виконуй uninstall перед оновленням: він видаляє AsyncStorage, task photos і
власний фон. Перед ризиковою перевстановкою експортуй потрібні списки як
`.sheettodo`.

## Дозволи будильника

Під час першого reminder:

1. дозволь notifications;
2. на Android 12+ дозволь **Alarms & reminders**;
3. за потреби вимкни battery optimization для застосунку.

Android reminder використовує exact AlarmManager trigger, ongoing notification,
loop sound, full-screen action і кнопку зупинки. Після надання системного доступу
повернися в застосунок і збережи reminder повторно.

## Імпорт і передавання

Людині зручно надіслати список як текст. Для перенесення фото використовуй
`.sheettodo`. Отримувач може:

1. натиснути файл і вибрати Sheet: to do;
2. або зберегти файл у Downloads та вибрати **Імпорт** у застосунку.

Другий варіант працює навіть тоді, коли месенджер передає нестандартний MIME-type.

## Перевірка після встановлення

1. Створи список і task, закрий та відкрий застосунок.
2. Перевір offline restart в airplane mode.
3. Додай і видали фото.
4. Встанови exact alarm на кілька хвилин у майбутньому.
5. Перевір alarm у foreground, background і на locked screen.
6. Експортуй та повторно імпортуй `.sheettodo`.

## Типові проблеми

- **App not installed:** інший signing key, замалий versionCode або пошкоджений APK.
- **Problem parsing package:** неповне завантаження або несумісний Android build.
- **Alarm не спрацьовує:** перевір notifications, Alarms & reminders і battery settings.
- **Немає Sheet: to do в Open with:** скористайся внутрішньою кнопкою імпорту.
- **Дані зникли:** uninstall очистив app sandbox; імпортуй збережений `.sheettodo`.

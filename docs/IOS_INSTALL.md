# Встановлення Sheet: to do на iPhone

## Передумови

- macOS з актуальним Xcode;
- Node.js 22 LTS і npm;
- CocoaPods;
- iPhone з увімкненим Developer Mode;
- Apple ID для Xcode signing.

Native-проєкт генерується з `app.json`. Каталог `ios/`, сертифікати й provisioning
profiles не додаються до Git.

## Локальна development-збірка

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run ios -- --device
```

Expo попросить вибрати підключений iPhone, згенерує `ios/`, встановить pods і
запустить Xcode build. Для ручного керування Xcode:

```bash
npx expo prebuild --platform ios --clean
cd ios
pod install
cd ..
open ios/Sheettodo.xcworkspace
```

У Xcode відкрий target застосунку, розділ **Signing & Capabilities**, увімкни
**Automatically manage signing** і вибери свій Team. Bundle identifier:
`com.lilydotsenko.sheettodo`.

Якщо цей identifier уже зайнятий іншим Apple team, його треба змінити в
`app.json` до першої підписаної збірки. Для оновлень identifier має залишатися
незмінним.

## Безкоштовний Apple ID

Xcode показує безкоштовний акаунт як **Personal Team**. Він придатний для
особистого тестового iPhone без публікації в App Store.

Обмеження Personal Team:

- provisioning profile діє 7 днів;
- після завершення строку build потрібно зібрати й установити повторно;
- до 10 App IDs, до 3 пристроїв і до 3 встановлених development apps на пристрій;
- ad hoc distribution та EAS device build недоступні без paid membership;
- деякі спеціальні capabilities, зокрема critical alerts, недоступні.

Дані не зникають при повторному встановленні поверх застосунку з тим самим bundle
identifier і team. Uninstall очищає AsyncStorage та приватні JPEG.

## Платний Apple Developer Program та ad hoc

Зареєструй UDID iPhone:

```bash
npx eas-cli@latest device:create
```

Створи installable preview IPA:

```bash
npx eas-cli@latest build --platform ios --profile preview
```

EAS створює ad hoc provisioning profile. IPA встановиться лише на пристрої,
UDID яких був включений у profile до збірки. Після додавання нового iPhone
потрібна нова збірка або re-sign.

Development client через EAS:

```bash
npx eas-cli@latest build --platform ios --profile development
```

Жодна з цих команд не публікує застосунок. `eas submit` не використовується.

## iOS Simulator

Simulator не потребує device provisioning:

```bash
npx eas-cli@latest build --platform ios --profile development-simulator
```

Або локально:

```bash
npm run ios
```

Simulator не є достатньою перевіркою notification permissions, звуку, photo
picker, Share Sheet або поведінки background/cold start.

## Системні дозволи

Під час першого alarm застосунок запитує notifications. Для фотографій показує
окремий Photos prompt. Камера, мікрофон, геолокація та push notifications не
використовуються.

iOS reminder має Time Sensitive interruption level, default sound і дію
зупинки. Він не обходить Silent Mode/Focus так, як Critical Alert, і не може
автоматично показати Android-подібний full-screen alarm.

## Перевірка на iPhone

1. Створи список і завдання, перезапусти застосунок і перевір відновлення.
2. Увімкни airplane mode та повтори CRUD і restart.
3. Додай і видали фото та власний фон.
4. Створи reminder на кілька хвилин у майбутньому.
5. Перевір foreground, background, locked screen і cold-start tap.
6. Надішли `.sheettodo`, відкрий його з Files і повторно імпортуй.
7. Перевір edge-swipe back, клавіатуру, iPhone SE-size та Pro Max-size layout.

Повна матриця міститься в `.maestro/DEVICE_CHECKLIST.md`.

## Захист signing-даних

Не додавай до Git:

- `credentials.json`;
- `.p8`, `.p12`, `.cer`, `.key`, `.pem`;
- `.mobileprovision` або `.provisionprofile`;
- Apple ID passwords чи app-specific passwords.

Використовуй Xcode Keychain або EAS-managed credentials. У репозиторії немає
файлів, які потребують секретних env-змінних.

## Типові проблеми

- **No profiles found:** вибери Team і automatic signing, перевір bundle ID.
- **Developer Mode disabled:** увімкни його в Privacy & Security та перезавантаж iPhone.
- **Untrusted Developer:** підтвердь developer app у VPN & Device Management.
- **Profile expired:** повторно збери й установи Personal Team build.
- **Notifee native module missing:** не використовуй Expo Go; перебудуй native app.
- **Notification не звучить:** перевір app notification settings, Focus і Silent Mode.
- **`.sheettodo` не відкривається:** збережи у Files та вибери імпорт усередині app.

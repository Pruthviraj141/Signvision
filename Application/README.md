- connect to device using USB.
- Enable USB debuging.

```bash
pnpm run andoid
```

```bash
npx expo start
```
press a (to open in android)
## Local API configuration

Copy `.env.example` to `.env` and set the two API URLs before starting Expo.
The checked-in example is configured for the Android emulator, where `10.0.2.2`
means the development machine. The backend services must listen on `0.0.0.0` on
ports `8000` and `8001`.

Restart Expo with a cleared cache after changing `.env`:

```bash
npx expo start --clear --dev-client
```

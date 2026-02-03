# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Configuration

The Expo client reads Nakama connection settings from environment variables (or Expo `extra` config). Provide the following values before starting the app:

- `EXPO_PUBLIC_NAKAMA_HOST`: Nakama host (ex: `localhost`)
- `EXPO_PUBLIC_NAKAMA_PORT`: Nakama port (ex: `7350`)
- `EXPO_PUBLIC_NAKAMA_USE_SSL`: `true`/`false` to enable TLS
- `EXPO_PUBLIC_NAKAMA_SERVER_KEY`: Public server key used by the client for socket auth
- `EXPO_PUBLIC_NAKAMA_TIMEOUT_MS`: Optional timeout override in milliseconds (default `7000`)

The local backend stack (Nakama + Postgres) is configured in `backend/README.md`, including the `.env` secrets and the Docker Compose workflow. Use those instructions to run the backend before starting the Expo app.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

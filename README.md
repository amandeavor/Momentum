# Momentum

An Expo and React Native productivity application for tasks, habits, focus sessions, notes, goals, scheduling, and personal analytics.

## Status

This is an in-progress mobile application. The repository includes Expo configuration and EAS build settings, but no current release artifact is linked here.

## Technology

- React Native, Expo, and TypeScript
- Expo Router
- Redux Toolkit and Redux Persist
- Supabase client integration

## Repository structure

- `src/app/`: application routes, authentication, onboarding, and primary screens
- `src/components/`: reusable interface and feature components
- `src/services/`: application services
- `src/store/`: application state
- `src/utils/`: shared utilities and configuration

## Local development

Prerequisites: Node.js and an Expo-compatible mobile development environment.

```bash
git clone https://github.com/amandeavor/Momentum.git
cd Momentum
npm install
cp .env.example .env
npm start
```

For a platform-specific development session:

```bash
npm run android
npm run ios
npm run web
```

## Configuration

Copy `.env.example` to `.env` and supply the Supabase project URL and public anonymous key required by the app. Do not commit local environment files.

## Builds

The repository includes `eas.json` for EAS Build configuration. Review the EAS project settings and environment values before producing a distributable build.

## License

No repository-level license file is currently included.

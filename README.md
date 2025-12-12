# Momentum

> **Master your time. Conquer your goals.**

Momentum is a premium productivity application built with **React Native** and **Expo**. It combines task management, habit tracking, and focus timers into a single, beautiful interface designed to help you achieve peak performance.

## Features

-   **Omni-Note System**: Capture ideas instantly with the Quick Notes feature.
-   **Intelligent Pomodoro**: Focus better with customizable work/break intervals and haptic feedback.
-   **Advanced Analytics**: Visualize your productivity with detailed charts, heatmaps, and "Peak Focus Hour" tracking.
-   **Goal & Task Management**: Organize your life with intuitive lists, deadlines, and priorities.
-   **Dark Mode First**: A stunning, battery-saving UI designed for focus.
-   **Secure & Sync**: Powered by Supabase for reliable cloud mastery.

## Download

**Version 1.2.0** is out now!
[**Download APK**](https://expo.dev/artifacts/eas/gbv3w9ig52LKLdN65pLzBa.apk)

## Tech Stack

-   **Framework**: React Native (Expo SDK 54)
-   **Language**: TypeScript
-   **State Management**: Redux Toolkit + Redux Persist
-   **Navigation**: Expo Router (File-based routing)
-   **Backend**: Supabase
-   **Styling**: Custom Design System (Dark/Light themes)
-   **Build Tool**: EAS Build

## Getting Started

### Prerequisites
-   Node.js (v18+)
-   Yarn (v1.22+)
-   Expo Go app on your physical device (optional)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/KonnichiwaAman/Momentum.git
    cd momentum
    ```

2.  **Install dependencies**
    ```bash
    yarn install
    ```

3.  **Start the app**
    ```bash
    npx expo start
    ```

4.  **Run on Android**
    -   Press `a` in the terminal to open in Android Emulator.
    -   Or scan the QR code with **Expo Go**.

## Building for Production

To build the APK yourself using EAS:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login 

# Build APK
eas build --platform android --profile apk
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Copyright (c) 2025 KonnichiwaAman. All rights reserved.
Unauthorized copying, modification, distribution, or sale of this software, via any medium, is strictly prohibited.
This project is proprietary and confidential.
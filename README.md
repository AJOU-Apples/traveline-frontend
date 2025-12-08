# traveline-frontend

> **Traveline**은 여행을 함께 계획하고 기록할 수 있는 모바일 여행 플래너 앱입니다.  
> 이 프로젝트는 **React Native + Expo + TypeScript** 기반으로 개발되었습니다.

---

## 🚀 Tech Stack

| Category | Tech |
|-----------|------|
| Framework | [Expo](https://expo.dev/) (React Native) |
| Language | TypeScript |
| State Management | Zustand |
| Navigation | React Navigation |
| Styling | Styled-Components / React Native Paper |
| API Communication | Axios |
| Build & Deploy | EAS Build (Expo Application Services) |

---

## 🧭 Folder Structure

```
traveline-frontend/
├── .github/                  # GitHub PR / Issue templates
├── assets/                   # Fonts, images, icons
├── src/
│   ├── api/                  # Axios clients, API definitions
│   ├── components/           # Common reusable UI components
│   ├── screens/              # App screens (Auth, Travel, Profile...)
│   ├── navigation/           # React Navigation config
│   ├── stores/               # Zustand stores
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── constants/            # Colors, fonts, API endpoints, etc.
│   └── types/                # Global TypeScript type definitions
├── App.tsx                   # Root entry point
├── app.config.ts             # Expo configuration file
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Prerequisites

Before running the app, make sure you have these installed:

| Tool | Version | Install Guide |
|------|----------|----------------|
| **Node.js** | ≥ 18.x | [Download](https://nodejs.org/en/download/) |
| **Yarn** | ≥ 1.22 | `npm install -g yarn` |
| **Android Studio** *(for emulator)* | Latest | [Install](https://developer.android.com/studio) |

---

## 🧩 Environment Setup (only once)

1. Clone the repository
   ```bash
   git clone https://github.com/AJOU-Apples/traveline-frontend.git
   cd traveline-frontend
   ```

2. Install dependencies
   ```bash
   yarn install
   ```
   or
   ```bash
   npm install
   ```

3. Start the Expo development server
   ```bash
   npx expo start
   ```
---
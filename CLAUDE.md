# GardenCare — Real App

## Setup
- `npm install` — install deps
- `npm run dev` — frontend на http://localhost:5173
- `cd functions && npm install` — install Functions deps
- Firebase emulator: `firebase emulators:start`

## Tech Stack
- React 19 + Vite + Tailwind CSS v4
- Firebase v11+ (Auth, Firestore, Functions, FCM), modular API
- Cloudinary (image storage, unsigned upload preset)
- Gemini 2.5 Flash (AI — само от Functions backend)

## Rules
- API ключове само в Functions — никога в frontend src/
- Freemium: free=20 AI анализа/месец, 3 растения; premium=unlimited
- Admin: role='admin' в Firestore → без лимити
- Всички Firestore операции проверяват auth в security rules
- Поле за торене: `fertilizing_frequency_days` (не голото `frequency_days` от PoC)
- Env vars: `VITE_` префикс за frontend, без префикс за Functions
- Commit след всяка завършена задача

## Handoff — НЕ прави без потвърждение
- `firebase deploy` (production deploy)
- Промяна на Firestore security rules в production
- Изтриване на данни от Firestore

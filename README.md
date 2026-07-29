# CDRMS-Mobile

React Native (Expo) mobile app with **React Navigation** and **gluestack-ui**.

## Stack

- Expo SDK 57 + TypeScript
- React Navigation (native stack + bottom tabs available)
- gluestack-ui v5 with UniWind (Tailwind CSS v4)

## Getting started

```bash
cd ~/Desktop/CDRMS-Mobile
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Project structure

```
App.tsx                 # App providers (Gluestack + gestures)
src/
  navigation/           # React Navigation setup
  screens/              # App screens
components/ui/          # gluestack-ui components
```

## Add more gluestack components

```bash
npx gluestack-ui@latest add input card avatar --use-npm -y
```

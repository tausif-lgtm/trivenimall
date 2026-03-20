# Triveni Mall Operations — Android App

React Native (Expo) mobile app for the Triveni Mall Operations management system.

---

## Setup

### 1. Install dependencies
```bash
cd mall-android
npm install
```

### 2. Configure API URL

Open `src/lib/api.js` and update `API_BASE` to your backend server's local IP:

```js
const API_BASE = 'http://192.168.29.93:3201/api';
```

> **How to find your IP:**
> Windows: `ipconfig` → look for "IPv4 Address" under your Wi-Fi adapter
> Make sure your phone and computer are on the **same Wi-Fi network**

### 3. Start the app
```bash
npm start
# or
npx expo start
```

Scan the QR code with **Expo Go** app (Android) or press `a` to open on an Android emulator.

---

## Features by Role

| Role     | Features |
|----------|----------|
| **Admin** | Dashboard, Ticket management, Checklist templates + monitoring, User management |
| **Staff** | Dashboard, Assigned tickets, Daily checklists with photo/remark upload |
| **Security** | Patrol dashboard, Incident reporting, Security checklists |
| **HelpDesk** | All tickets view, Ticket management |
| **Tenant** | Raise tickets, Track ticket status, Notifications |

---

## Screens

```
Login
├── Admin
│   ├── Dashboard (stats, checklist alert, recent tickets)
│   ├── Tickets (filter by status/category, search)
│   ├── Checklists (templates tab + monitoring tab)
│   │   └── MonitorDetail (schedule item view)
│   ├── Users (role filter, add/delete)
│   └── Profile
├── Staff
│   ├── Dashboard (checklist alert, ticket stats)
│   ├── Tickets
│   ├── Checklists (today's + overdue)
│   │   └── ExecuteChecklist (tick items, remark, photo, submit)
│   └── Profile
├── Tenant
│   ├── Dashboard
│   ├── My Tickets
│   └── Profile
├── Security
│   ├── Dashboard (patrol checklists)
│   ├── Incidents
│   └── Profile
├── HelpDesk
│   ├── Dashboard
│   ├── All Tickets
│   └── Profile
└── Shared (accessible from any role)
    ├── TicketDetail (view + reply + status change)
    ├── NewTicket (raise ticket form)
    └── Notifications
```

---

## Build APK

### Prerequisites
- Install EAS CLI: `npm install -g eas-cli`
- Login: `eas login`
- Configure: `eas build:configure`

### Build
```bash
eas build --platform android --profile preview
```

This produces a `.apk` file downloadable from the EAS dashboard.

---

## Tech Stack
- **React Native** with Expo SDK 51
- **React Navigation** v6 (Stack + Bottom Tabs)
- **Axios** for API calls
- **expo-secure-store** for JWT token storage
- **expo-image-picker** for photo uploads
- **react-native-toast-message** for notifications
- **socket.io-client** for real-time updates

# Alcove Realty — Customer Portal & Ticket Management System

A production-ready portal for Real Estate Flat Owners to raise and track service tickets. Includes an Admin panel, Staff assignment workflow, Customer self-service interface, and an Android mobile app.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | Next.js 14 (Pages Router), Tailwind CSS         |
| Backend   | Node.js, Express.js, Socket.io                  |
| Database  | MySQL 8.x                                       |
| Auth      | JWT (stored in localStorage + cookie)           |
| Uploads   | Multer (stored in `backend/uploads/`)           |
| Real-time | Socket.io (notifications)                       |
| Mobile    | Expo React Native (WebView + native push notif) |

---

## Ports

| Service  | Port |
|----------|------|
| Backend  | 3006 |
| Frontend | 4000 |

---

## Quick Start (Windows)

Double-click **`start.bat`** in the project root. It will:
1. Kill any existing processes on ports 3006 and 4000
2. Start the Backend server (port 3006)
3. Start the Frontend server (port 4000)

Then open: **http://localhost:4000** (desktop) or **http://192.168.29.93:4000** (phone/mobile)

---

## Manual Setup

### Prerequisites

- Node.js v18+
- MySQL 8.x running locally
- npm

---

### Step 1 — Database Setup

```bash
mysql -u root -p < database/schema.sql
```

This creates the `customer_portal` database with all tables and seed data.

> **Note on seed passwords:** If login fails after import, run `node backend/scripts/seed.js`, copy the printed SQL, and run it in MySQL.

---

### Step 2 — Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```
PORT=3006
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=customer_portal
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

```bash
npm install
node server.js
```

Backend runs at: **http://localhost:3006**

---

### Step 3 — Frontend Setup

```bash
cd frontend
npm install
npm run build
npm start
```

Frontend runs at: **http://localhost:4000**

> `NEXT_PUBLIC_API_URL` defaults to `http://192.168.29.93:3006/api` (set in `next.config.js`). Change this to your machine's local IP if different.

---

## Default Login Credentials

| Role     | Email               | Password  |
|----------|---------------------|-----------|
| Admin    | admin@portal.com    | Admin@123 |
| Staff    | staff@portal.com    | Admin@123 |
| Customer | customer@portal.com | Admin@123 |

---

## Mobile App (Android)

The mobile app is an Expo React Native WebView wrapper with native Android push notifications.

### Pre-built APK

`CustomerPortal.apk` is in the project root — install directly on Android.

### Build from Source

**Requirements:**
- Android Studio + SDK (set `ANDROID_HOME`)
- Java 17
- Node.js v18+

**Steps:**

```bash
cd mobile
npm install

# 1. Generate Android project
npx expo prebuild --clean

# 2. After prebuild, manually apply these fixes:

# Fix A — Gradle version (android/gradle/wrapper/gradle-wrapper.properties)
# Change: gradle-8.8-all.zip → gradle-8.6-all.zip

# Fix B — HTTP traffic (android/app/src/main/AndroidManifest.xml)
# Add to <application> tag: android:usesCleartextTraffic="true"

# Fix C — SDK path (android/local.properties)
# Add: sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk

# 3. Build APK
cd android
./gradlew assembleRelease
```

Output APK: `android/app/build/outputs/apk/release/app-release.apk`

> **Note:** `expo prebuild --clean` resets AndroidManifest and gradle-wrapper every time — fixes B and C must be re-applied after each prebuild.

---

## Project Structure

```
Customer portal/
├── start.bat                   # One-click server starter (Windows)
├── database/
│   └── schema.sql              # MySQL schema + seed data
│
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js   # Login, register, forgot password (OTP)
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   ├── flatController.js
│   │   ├── ticketController.js
│   │   ├── dashboardController.js  # Parallelized queries (Promise.all)
│   │   ├── notificationController.js
│   │   ├── amenityController.js
│   │   ├── communicationController.js
│   │   └── constructionController.js
│   ├── middleware/
│   │   └── auth.js             # JWT + role middleware
│   ├── models/
│   ├── routes/
│   ├── uploads/                # File upload storage
│   ├── .env.example
│   └── server.js               # Express + Socket.io server
│
├── frontend/
│   ├── components/
│   │   ├── Layout.js           # Sidebar + header (role-aware)
│   │   ├── NotificationBell.js # Real-time notifications + WebView bridge
│   │   ├── StatsCard.js
│   │   ├── TicketStatusBadge.js
│   │   └── TicketPriorityBadge.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── lib/
│   │   ├── api.js              # Axios instance with auth interceptor
│   │   └── auth.js
│   ├── pages/
│   │   ├── login.js
│   │   ├── forgot-password.js  # OTP-based password reset
│   │   ├── dashboard/          # Customer pages
│   │   ├── admin/              # Admin pages (tickets, users, projects, flats, notifications)
│   │   └── staff/              # Staff pages
│   ├── public/
│   │   └── sw.js               # Service worker (PWA cache)
│   └── next.config.js
│
└── mobile/
    ├── App.js                  # WebView app + native push notifications
    ├── app.json                # Expo config (name, icon, colors)
    └── android/                # Generated Android project (after expo prebuild)
```

---

## API Reference

| Method | Endpoint                          | Access   | Description                     |
|--------|-----------------------------------|----------|---------------------------------|
| POST   | /api/auth/login                   | Public   | Login                           |
| POST   | /api/auth/register                | Public   | Register                        |
| POST   | /api/auth/forgot-password         | Public   | Send OTP to email               |
| POST   | /api/auth/verify-otp              | Public   | Verify OTP                      |
| POST   | /api/auth/reset-password          | Public   | Reset password with OTP         |
| GET    | /api/auth/profile                 | Any auth | Get own profile                 |
| GET    | /api/dashboard/admin              | Admin    | Admin dashboard stats           |
| GET    | /api/dashboard/customer           | Any auth | Customer dashboard              |
| GET    | /api/dashboard/staff              | Any auth | Staff dashboard                 |
| GET    | /api/tickets                      | Any auth | List tickets (filtered by role) |
| POST   | /api/tickets                      | Any auth | Create ticket                   |
| GET    | /api/tickets/:id                  | Any auth | Get ticket + updates            |
| PUT    | /api/tickets/:id                  | Any auth | Update ticket                   |
| PATCH  | /api/tickets/:id/assign-staff     | Admin    | Assign staff                    |
| POST   | /api/tickets/:id/updates          | Any auth | Add comment/update              |
| GET    | /api/users                        | Admin    | List users                      |
| POST   | /api/users                        | Admin    | Create user                     |
| PUT    | /api/users/:id                    | Admin    | Update user                     |
| DELETE | /api/users/:id                    | Admin    | Delete user                     |
| GET    | /api/projects                     | Any auth | List projects                   |
| POST   | /api/projects                     | Admin    | Create project                  |
| GET    | /api/flats                        | Admin    | List all flats                  |
| GET    | /api/flats/my-flats               | Any auth | Get own flats                   |
| POST   | /api/notifications/send           | Admin    | Send notification to users      |

---

## Role Permissions

| Feature                  | Admin | Staff | Customer |
|--------------------------|-------|-------|----------|
| View ALL tickets         | Yes   | No    | No       |
| View assigned tickets    | —     | Yes   | —        |
| View own tickets         | —     | —     | Yes      |
| Create ticket            | Yes   | No    | Yes      |
| Assign staff             | Yes   | No    | No       |
| Update ticket status     | Yes   | Yes   | No       |
| Add ticket comment       | Yes   | Yes   | Yes      |
| Manage users             | Yes   | No    | No       |
| Manage projects/flats    | Yes   | No    | No       |
| Send notifications       | Yes   | No    | No       |

---

## Notifications

- Admin sends notifications from **Admin → Send Notification** page
- Delivered in real-time via **Socket.io** to the bell icon in the header
- On the **Android app**, notifications also appear in the **status bar** (native push)
- Notification bridge: `NotificationBell.js` → `window.ReactNativeWebView.postMessage()` → `App.js` → `expo-notifications`

---

## Ticket Number Format

Tickets are auto-numbered: `TKT-YYYY-NNNN`

Example: `TKT-2024-0001`, `TKT-2025-0042`

---

## File Uploads

- Stored in `backend/uploads/`
- Served at `http://localhost:3006/uploads/<filename>`
- Max size: 5MB
- Allowed types: images (jpg, png, gif), PDF, Word documents

---

## Known Notes

- **OTP timezone**: Backend uses `UTC_TIMESTAMP()` in MySQL queries to avoid IST/UTC mismatch
- **Mobile IP**: `NEXT_PUBLIC_API_URL` must point to the server's LAN IP (not `localhost`) for phone access
- **Windows Firewall**: Ports 3006 and 4000 must be allowed for phone connections on the same WiFi

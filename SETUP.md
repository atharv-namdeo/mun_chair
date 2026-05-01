# MUN Chair Pro — Firebase Setup

## 1. Create a Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `mun-chair-pro`)
3. Disable Google Analytics if not needed → **Create project**

## 2. Enable Firestore
1. In your project → **Build** → **Firestore Database**
2. Click **Create database** → **Start in test mode** → Choose a region → **Done**

## 3. Enable Anonymous Auth
1. **Build** → **Authentication** → **Get started**
2. **Sign-in method** tab → **Anonymous** → **Enable** → **Save**

## 4. Get Your Config
1. Click the gear ⚙️ → **Project settings**
2. Under **Your apps** → click **</>** (Web)
3. Register the app → copy the `firebaseConfig` object values

## 5. Configure the App
1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Fill in each value from your Firebase config

## 6. Run the App
```bash
npm run dev
```

## Firestore Security Rules (Recommended)
After testing, set these rules in **Firestore → Rules**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
This requires anonymous auth (already set up) — blocks unauthenticated access.

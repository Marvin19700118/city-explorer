'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDXJf1XrYYWX_z-zyWeZEz5STRebTC7jNQ",
  authDomain: "city-unveiler.firebaseapp.com",
  projectId: "city-unveiler",
  storageBucket: "city-unveiler.appspot.com",
  messagingSenderId: "1003377700516",
  appId: "1:1003377700516:web:8adbafbd3b53e4c33ac031"
};

// Always treat Firebase as configured since the config is hardcoded.
export const firebaseConfigured = true;

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}
auth = getAuth(app);


export { app, auth };

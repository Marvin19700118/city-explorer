'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDXJf1XrYYWX_z-zyWeZEz5STRebTC7jNQ",
  authDomain: "city-unveiler.firebaseapp.com",
  projectId: "city-unveiler",
  storageBucket: "city-unveiler.firebasestorage.app",
  messagingSenderId: "1003377700516",
  appId: "1:1003377700516:web:8adbafbd3b53e4c33ac031"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const firebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

if (firebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
}

export { app, auth, firebaseConfigured };

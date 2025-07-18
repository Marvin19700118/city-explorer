'use client';

import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth, firebaseConfigured } from './client';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    console.warn("Firebase is not configured. Cannot sign in.");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error during sign-in:", error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  if (!auth) {
    console.warn("Firebase is not configured. Cannot sign out.");
    return;
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error during sign-out:", error);
  }
}

export function listenForAuthChanges(callback: (user: User | null) => void): () => void {
  if (!auth) {
    // If firebase is not configured, immediately call back with no user and return a no-op unsubscribe function.
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

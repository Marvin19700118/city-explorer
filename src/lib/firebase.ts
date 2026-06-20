import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyBuIGMVBYnNp_2gAaErSb38HGi4Ysn-h5Q",
  authDomain:        "tinysteps-39alg.firebaseapp.com",
  projectId:         "tinysteps-39alg",
  storageBucket:     "tinysteps-39alg.firebasestorage.app",
  messagingSenderId: "622390411521",
  appId:             "1:622390411521:web:df1ff09599a19c805b1b00",
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db  = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

export const isFirebaseConfigured = true;

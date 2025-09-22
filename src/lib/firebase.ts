
import 'dotenv/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "fuzzystat",
  "appId": "1:493936855734:web:cd2325cdb18c833369f417",
  "storageBucket": "fuzzystat.firebasestorage.app",
  "apiKey": "AIzaSyB_W7xTLFuBxeervdjfkVdisHq8uLrSBE8",
  "authDomain": "fuzzystat.firebaseapp.com",
  "messagingSenderId": "493936855734"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

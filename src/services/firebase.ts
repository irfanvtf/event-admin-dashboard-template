import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdSfZFkzxpV8IbBX6Z1cS6jl9WrmV-ZNU",
  authDomain: "aux-training.firebaseapp.com",
  projectId: "aux-training",
  storageBucket: "aux-training.firebasestorage.app",
  messagingSenderId: "846125523335",
  appId: "1:846125523335:web:94fee73c364bd2da943322"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
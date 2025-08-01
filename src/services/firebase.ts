import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC_51uWY3vxVQ325S5C3wIOnCpTTul7QzM',
  authDomain: 'zafyre-app.firebaseapp.com',
  projectId: 'zafyre-app',
  storageBucket: 'zafyre-app.firebasestorage.app',
  messagingSenderId: '899874302896',
  appId: '1:899874302896:web:2311574e15935cfb77c475',
  measurementId: 'G-T9C70PETFN',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

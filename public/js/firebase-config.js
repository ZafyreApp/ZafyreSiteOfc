// public/js/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// Suas credenciais do Firebase (as que você me forneceu)
const firebaseConfig = {
  apiKey: "AIzaSyC_51uWY3vxVQ325S5C3wIOnCpTTul7QzM",
  authDomain: "zafyre-app.firebaseapp.com",
  projectId: "zafyre-app",
  storageBucket: "zafyre-app.firebasestorage.app",
  messagingSenderId: "899874302896",
  appId: "1:899874302896:web:2311574e15935cfb77c475",
  measurementId: "G-T9C70PETFN"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exportar instâncias para serem usadas em outros arquivos JS
export { app, auth, db, storage };

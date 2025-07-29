// public/js/firebase-init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_51uWY3vxVQ325S5C3wIOnCpTTul7QzM",
    authDomain: "zafyre-app.firebaseapp.com",
    projectId: "zafyre-app",
    storageBucket: "zafyre-app.firebasestorage.app",
    messagingSenderId: "899874302896",
    appId: "1:899874302896:web:2311574e15935cfb77c475",
    measurementId: "G-T9C70PETFN"
};

// Firebase configurado com credenciais válidas
console.log("✅ Firebase configurado com credenciais válidas");

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig);
console.log("✅ Firebase client app inicializado.");

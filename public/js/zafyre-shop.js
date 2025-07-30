// public/js/chat.js
import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Usuário logado na página de Chat:", user.uid);
            // Lógica específica do chat virá aqui
        } else {
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = 'index.html';
        }
    });

    // Adicione aqui qualquer lógica de interatividade básica dos elementos HTML (botões, etc.)
    // A funcionalidade completa do chat (Firestore, etc.) será construída em etapas futuras.
});

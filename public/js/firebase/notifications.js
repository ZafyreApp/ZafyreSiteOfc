// public/js/notifications.js

import { getFirestore, collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js"; // Ajuste a versão se necessário
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js"; // Ajuste a versão se necessário
import { app } from './firebase-init.js'; // Importa a instância 'app' do seu arquivo de inicialização

const db = getFirestore(app); // Obtém a instância do Firestore
const auth = getAuth(app);   // Obtém a instância do Auth

const notificationsList = document.getElementById('notifications-list');
const loadingMessage = document.querySelector('.loading-message');
const noNotificationsMessage = document.getElementById('no-notifications-message');

// Escuta o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.uid);
        fetchNotifications(user.uid);
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/'; // Redireciona para a tela de login (que é login.html, mas a rota '/' serve-o)
    }
});

function fetchNotifications(userId) {
    const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        notificationsList.innerHTML = '';
        loadingMessage.classList.add('hidden');

        if (snapshot.empty) {
            noNotificationsMessage.classList.remove('hidden');
            return;
        }

        noNotificationsMessage.classList.add('hidden');

        snapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationItem = document.createElement('div');
            notificationItem.classList.add('notification-item');

            let notificationText = '';
            let avatarUrl = notification.senderAvatar || 'https://via.placeholder.com/40';

            switch (notification.type) {
                case 'like':
                    notificationText = `<strong>${notification.senderName}</strong> curtiu sua postagem.`;
                    break;
                case 'comment':
                    notificationText = `<strong>${notification.senderName}</strong> comentou: "${notification.commentText}" na sua postagem.`;
                    break;
                case 'follow':
                    notificationText = `<strong>${notification.senderName}</strong> começou a seguir você.`;
                    break;
                default:
                    notificationText = `Você tem uma nova notificação.`;
            }

            const timeAgo = formatTimeAgo(notification.timestamp?.toDate());

            notificationItem.innerHTML = `
                <img src="${avatarUrl}" alt="Avatar" class="notification-avatar">
                <div class="notification-content">
                    <p>${notificationText}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
            `;
            notificationsList.appendChild(notificationItem);
        });
    }, (error) => {
        console.error("Erro ao buscar notificações:", error);
        notificationsList.innerHTML = '<p class="error-message">Erro ao carregar notificações.</p>';
        loadingMessage.classList.add('hidden');
    });
}

function formatTimeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos atrás";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses atrás";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " dias atrás";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas atrás";
    if (seconds / 60 > 1) return Math.floor(seconds / 60) + " minutos atrás"; // Correção para minutos
    return Math.floor(seconds) + " segundos atrás";
}


// public/js/subscriptions.js

import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

let currentUser = null;

// Função para carregar criadoras seguidas
async function loadSubscribedCreators() {
    const container = document.getElementById('subscribed-creators');
    
    if (!currentUser) {
        container.innerHTML = '<div class="info-message">Faça login para ver suas assinaturas</div>';
        return;
    }

    try {
        // Buscar lista de usuários seguidos
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        const following = userData?.following || [];

        if (following.length === 0) {
            container.innerHTML = '<div class="info-message">Você ainda não segue nenhuma criadora</div>';
            return;
        }

        container.innerHTML = '';

        // Carregar dados de cada criadora seguida
        for (const creatorId of following) {
            try {
                const creatorDoc = await getDoc(doc(db, 'users', creatorId));
                if (creatorDoc.exists()) {
                    const creator = creatorDoc.data();
                    const creatorCard = createCreatorCard(creatorId, creator);
                    container.appendChild(creatorCard);
                }
            } catch (error) {
                console.error('Erro ao carregar criadora:', error);
            }
        }

    } catch (error) {
        console.error('Erro ao carregar criadoras seguidas:', error);
        container.innerHTML = '<div class="info-message">Erro ao carregar assinaturas</div>';
    }
}

// Função para criar card de criadora
function createCreatorCard(creatorId, creator) {
    const card = document.createElement('div');
    card.className = 'creator-card';
    
    card.innerHTML = `
        <div class="creator-avatar-container">
            <img src="${creator.photoURL || 'default-avatar.png.jpg'}" alt="${creator.displayName}" class="creator-avatar">
            ${creator.isPremium ? '<div class="premium-badge">Premium</div>' : ''}
        </div>
        <div class="creator-info">
            <h3 class="creator-name">${creator.displayName || 'Criadora'}</h3>
            <p class="creator-bio">${creator.bio || 'Sem biografia'}</p>
            <div class="creator-stats">
                <span class="creator-followers">${creator.followersCount || 0} seguidores</span>
                <span class="creator-posts">${creator.postsCount || 0} posts</span>
            </div>
        </div>
        <div class="creator-actions">
            <button class="profile-button profile-button-primary" onclick="window.location.href='user-profile.html?userId=${creatorId}'">
                Ver Perfil
            </button>
            <button class="profile-button profile-button-chat" onclick="startChat('${creatorId}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>
                Chat
            </button>
        </div>
    `;
    
    return card;
}

// Função para carregar conteúdos comprados
async function loadPurchasedContent() {
    const container = document.getElementById('purchased-content');
    
    if (!currentUser) {
        container.innerHTML = '<div class="info-message">Faça login para ver seus conteúdos</div>';
        return;
    }

    try {
        // Buscar transações de PPV do usuário
        const transactionsRef = collection(db, 'transactions');
        const q = query(
            transactionsRef,
            where('userId', '==', currentUser.uid),
            where('type', '==', 'ppv'),
            where('status', '==', 'approved'),
            orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="info-message">Você ainda não comprou nenhum conteúdo PPV</div>';
            return;
        }

        container.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const transaction = doc.data();
            const contentCard = createContentCard(transaction);
            container.appendChild(contentCard);
        });

    } catch (error) {
        console.error('Erro ao carregar conteúdos comprados:', error);
        container.innerHTML = '<div class="info-message">Erro ao carregar conteúdos</div>';
    }
}

// Função para criar card de conteúdo comprado
function createContentCard(transaction) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    const purchaseDate = transaction.timestamp?.toDate?.() || new Date();
    
    card.innerHTML = `
        <div class="content-thumbnail">
            <img src="${transaction.contentThumbnail || 'default-avatar.png.jpg'}" alt="Conteúdo">
        </div>
        <div class="content-info">
            <h3 class="content-title">${transaction.contentTitle || 'Conteúdo PPV'}</h3>
            <p class="content-creator">Por: ${transaction.creatorName || 'Criadora'}</p>
            <div class="content-details">
                <span class="content-price">R$ ${(transaction.amount || 0).toFixed(2)}</span>
                <span class="content-date">${purchaseDate.toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
        <div class="content-actions">
            <button class="profile-button profile-button-primary" onclick="viewContent('${transaction.postId}')">
                Ver Conteúdo
            </button>
        </div>
    `;
    
    return card;
}

// Função para iniciar chat
window.startChat = function(creatorId) {
    window.location.href = `chat.html?userId=${creatorId}`;
};

// Função para visualizar conteúdo
window.viewContent = function(postId) {
    window.location.href = `user-profile.html?postId=${postId}`;
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            console.log('Usuário autenticado em Assinaturas:', user.uid);
            loadSubscribedCreators();
            loadPurchasedContent();
        } else {
            console.log('Usuário não autenticado, redirecionando...');
            window.location.href = 'login.html';
        }
    });
});

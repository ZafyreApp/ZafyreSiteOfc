
// public/js/user-profile-male.js

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    collection, 
    query, 
    where, 
    orderBy, 
    limit,
    getDocs, 
    addDoc,
    serverTimestamp,
    increment 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = 'dblahe34z';
const CLOUDINARY_UPLOAD_PRESET = 'zafyre_users_unsigned';

// Elementos da UI
const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const userBio = document.getElementById('user-bio');
const premiumUserBadge = document.getElementById('premium-user-badge');
const userPostsCount = document.getElementById('user-posts-count');
const userFollowersCount = document.getElementById('user-followers-count');
const userLikesCount = document.getElementById('user-likes-count');
const userInteractionsCount = document.getElementById('user-interactions-count');

// Elementos de criação de post
const userPostTextInput = document.getElementById('user-post-text-input');
const userPostExpanded = document.getElementById('user-post-expanded');
const userAddMediaBtn = document.getElementById('user-add-media-btn');
const userPublishPostBtn = document.getElementById('user-publish-post-btn');
const userMediaUploadInput = document.getElementById('user-media-upload-input');
const userMediaPreviewContainer = document.getElementById('user-media-preview-container');
const userMediaPreview = document.getElementById('user-media-preview');
const userVideoPreview = document.getElementById('user-video-preview');
const userRemoveMediaBtn = document.getElementById('user-remove-media-btn');

// Elementos de carteira
const userCoinsBalance = document.getElementById('user-coins-balance');

// Elementos de sistema de chat
const dailyMessagesRemaining = document.getElementById('daily-messages-remaining');
const photoStatus = document.getElementById('photo-status');
const watchAdBtn = document.getElementById('watch-ad-btn');
const buyMessagesBtn = document.getElementById('buy-messages-btn');

// Elementos de ranking
const userPosition = document.getElementById('user-position');
const userRankPosition = document.getElementById('user-rank-position');
const usersRankingList = document.getElementById('users-ranking-list');

// Posts grid
const userPostsGrid = document.getElementById('user-posts-grid');
const noUserPostsMessage = document.getElementById('no-user-posts-message');

// Modal elements
const editUserProfileModal = document.getElementById('edit-user-profile-modal');
const buyMessagesModal = document.getElementById('buy-messages-modal');

let currentUserId = null;
let currentUserData = null;
let selectedMedia = null;

// Autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado:", currentUserId);
        await loadUserProfile(currentUserId);
        await loadUserPosts(currentUserId);
        await loadUserWallet(currentUserId);
        await loadChatSystem(currentUserId);
        await loadUsersRanking();
        setupEventListeners();
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando...");
        window.location.href = '/';
    }
});

// Carregar perfil do usuário
async function loadUserProfile(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUserData = userDocSnap.data();
            
            // Verificar se é usuário (não criadora)
            if (currentUserData.userType === 'creator') {
                alert("Redirecionando para o perfil de criadora.");
                window.location.href = 'creator-profile.html';
                return;
            }

            userDisplayName.textContent = currentUserData.displayName || 'Usuário';
            userBio.textContent = currentUserData.bio || 'Sem biografia ainda.';
            userAvatar.src = currentUserData.photoURL || 'default-avatar.png.jpg';

            // Mostrar badge premium se aplicável
            if (currentUserData.isPremium) {
                premiumUserBadge.classList.remove('hidden');
            }

            // Atualizar contadores
            userFollowersCount.textContent = currentUserData.followersCount || 0;
            userLikesCount.textContent = currentUserData.totalLikes || 0;
            userInteractionsCount.textContent = currentUserData.totalInteractions || 0;

            // Atualizar avatar na caixa de criação
            document.getElementById('user-avatar-create').src = currentUserData.photoURL || 'default-avatar.png.jpg';

        } else {
            console.warn("Documento do usuário não encontrado");
            await createUserProfile(userId);
        }
    } catch (error) {
        console.error("Erro ao carregar perfil do usuário:", error);
    }
}

// Criar perfil inicial do usuário
async function createUserProfile(userId) {
    try {
        const userData = {
            displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            email: auth.currentUser.email,
            photoURL: auth.currentUser.photoURL || 'default-avatar.png.jpg',
            bio: '',
            userType: 'user',
            isPremium: false,
            followersCount: 0,
            followingCount: 0,
            totalLikes: 0,
            totalInteractions: 0,
            zafyreCoins: 100, // Bônus inicial
            dailyMessagesUsed: {},
            weeklyInteractions: 0,
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, "users", userId), userData);
        console.log("Perfil de usuário criado com sucesso");
        await loadUserProfile(userId);
    } catch (error) {
        console.error("Erro ao criar perfil de usuário:", error);
    }
}

// Carregar posts do usuário
async function loadUserPosts(userId) {
    try {
        const postsQuery = query(
            collection(db, "posts"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(postsQuery);

        userPostsGrid.innerHTML = '';

        if (querySnapshot.empty) {
            noUserPostsMessage.classList.remove('hidden');
            userPostsCount.textContent = 0;
            return;
        }

        noUserPostsMessage.classList.add('hidden');
        userPostsCount.textContent = querySnapshot.docs.length;

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = createUserPostThumbnail(post, doc.id);
            userPostsGrid.appendChild(postElement);
        });

    } catch (error) {
        console.error("Erro ao carregar posts do usuário:", error);
    }
}

// Criar miniatura do post
function createUserPostThumbnail(post, postId) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post-thumbnail');

    if (post.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = post.mediaUrl;
        video.controls = false;
        video.muted = true;
        postDiv.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = post.mediaUrl;
        img.alt = 'Post do usuário';
        postDiv.appendChild(img);
    }

    postDiv.addEventListener('click', () => {
        openPostModal(post, postId);
    });

    return postDiv;
}

// Carregar carteira do usuário
async function loadUserWallet(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const coins = userData.zafyreCoins || 0;

            userCoinsBalance.textContent = coins.toLocaleString();
        }
    } catch (error) {
        console.error("Erro ao carregar carteira:", error);
    }
}

// Carregar sistema de chat
async function loadChatSystem(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const today = new Date().toDateString();
            const dailyMessagesUsed = userData.dailyMessagesUsed || {};
            const usedToday = dailyMessagesUsed[today] || 0;
            const remaining = Math.max(0, 10 - usedToday);

            dailyMessagesRemaining.textContent = remaining;

            // Atualizar status de fotos
            const totalInteractions = userData.totalInteractions || 0;
            if (totalInteractions >= 20) {
                photoStatus.textContent = 'Liberado (10 ZafyreCoins por foto)';
                photoStatus.style.color = 'var(--success-green)';
            } else {
                photoStatus.textContent = `Desbloqueado após ${20 - totalInteractions} interações`;
                photoStatus.style.color = 'var(--text-secondary)';
            }

            // Habilitar/desabilitar botões
            const hasCoins = (userData.zafyreCoins || 0) >= 10;
            buyMessagesBtn.disabled = !hasCoins;
        }
    } catch (error) {
        console.error("Erro ao carregar sistema de chat:", error);
    }
}

// Carregar ranking de usuários
async function loadUsersRanking() {
    try {
        const rankingQuery = query(
            collection(db, "users"),
            where("userType", "==", "user"),
            orderBy("weeklyInteractions", "desc"),
            limit(10)
        );
        const querySnapshot = await getDocs(rankingQuery);

        usersRankingList.innerHTML = '';
        let currentUserPosition = null;

        querySnapshot.forEach((doc, index) => {
            const user = doc.data();
            const position = index + 1;

            if (doc.id === currentUserId) {
                currentUserPosition = position;
            }

            const rankingItem = createRankingItem(user, position, doc.id);
            usersRankingList.appendChild(rankingItem);
        });

        // Mostrar posição do usuário atual
        if (currentUserPosition) {
            userPosition.classList.remove('hidden');
            userRankPosition.textContent = `#${currentUserPosition}`;
        }

    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
        usersRankingList.innerHTML = '<p class="error-message">Erro ao carregar ranking</p>';
    }
}

// Criar item do ranking
function createRankingItem(user, position, userId) {
    const item = document.createElement('div');
    item.classList.add('ranking-item');
    
    if (userId === currentUserId) {
        item.classList.add('current-user');
    }

    item.innerHTML = `
        <div class="ranking-position">${position}</div>
        <img src="${user.photoURL || 'default-avatar.png.jpg'}" alt="${user.displayName}" class="ranking-avatar">
        <div class="ranking-info">
            <div class="ranking-name">${user.displayName || 'Usuário'}</div>
            <div class="ranking-stats">${user.weeklyInteractions || 0} interações esta semana</div>
        </div>
    `;

    return item;
}

// Configurar event listeners
function setupEventListeners() {
    // Expandir caixa de criação de post
    document.querySelector('.create-post-input').addEventListener('click', () => {
        userPostExpanded.classList.remove('hidden');
        userPostTextInput.focus();
    });

    // Input de texto do post
    userPostTextInput.addEventListener('input', () => {
        const hasText = userPostTextInput.value.trim().length > 0;
        const hasMedia = selectedMedia !== null;
        userPublishPostBtn.disabled = !(hasText || hasMedia);
    });

    // Botão de adicionar mídia
    userAddMediaBtn.addEventListener('click', () => {
        userMediaUploadInput.click();
    });

    // Upload de mídia
    userMediaUploadInput.addEventListener('change', handleMediaUpload);

    // Remover mídia
    userRemoveMediaBtn.addEventListener('click', () => {
        selectedMedia = null;
        userMediaPreviewContainer.classList.add('hidden');
        userMediaPreview.style.display = 'none';
        userVideoPreview.style.display = 'none';
        userMediaUploadInput.value = '';
        
        const hasText = userPostTextInput.value.trim().length > 0;
        userPublishPostBtn.disabled = !hasText;
    });

    // Publicar post
    userPublishPostBtn.addEventListener('click', handlePublishPost);

    // Assistir anúncio
    watchAdBtn.addEventListener('click', handleWatchAd);

    // Comprar mensagens
    buyMessagesBtn.addEventListener('click', () => {
        buyMessagesModal.classList.add('visible');
    });

    // Botões de compra de pacotes de mensagens
    document.querySelectorAll('.buy-package-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const messages = parseInt(e.target.dataset.messages);
            const cost = parseInt(e.target.dataset.cost);
            handleBuyMessages(messages, cost);
        });
    });

    // Modal de edição de perfil
    document.getElementById('edit-user-profile-btn').addEventListener('click', () => {
        editUserProfileModal.classList.add('visible');
        fillEditForm();
    });

    // Fechar modais
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('visible');
        });
    });

    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('visible');
        }
    });
}

// Manipular upload de mídia
async function handleMediaUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tamanho do arquivo (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 50MB.');
        return;
    }

    // Validar duração do vídeo (máximo 30 segundos)
    if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        
        video.addEventListener('loadedmetadata', () => {
            if (video.duration > 30) {
                alert('Vídeo muito longo. Máximo 30 segundos.');
                userMediaUploadInput.value = '';
                return;
            }
        });
    }

    selectedMedia = file;
    
    // Mostrar prévia
    if (file.type.startsWith('image/')) {
        userMediaPreview.src = URL.createObjectURL(file);
        userMediaPreview.style.display = 'block';
        userVideoPreview.style.display = 'none';
    } else if (file.type.startsWith('video/')) {
        userVideoPreview.src = URL.createObjectURL(file);
        userVideoPreview.style.display = 'block';
        userMediaPreview.style.display = 'none';
    }

    userMediaPreviewContainer.classList.remove('hidden');
    userPublishPostBtn.disabled = false;
}

// Publicar post
async function handlePublishPost() {
    const text = userPostTextInput.value.trim();

    if (!text && !selectedMedia) {
        alert('Adicione texto ou mídia para publicar.');
        return;
    }

    userPublishPostBtn.disabled = true;
    userPublishPostBtn.textContent = 'Publicando...';

    try {
        let mediaUrl = null;
        let mediaType = null;

        // Upload da mídia para o Cloudinary
        if (selectedMedia) {
            const formData = new FormData();
            formData.append('file', selectedMedia);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', `zafyre_posts/${currentUserId}`);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro no upload da mídia');
            }

            const data = await response.json();
            mediaUrl = data.secure_url;
            mediaType = data.resource_type;
        }

        // Criar post no Firestore
        const postData = {
            userId: currentUserId,
            userDisplayName: currentUserData.displayName,
            userPhotoURL: currentUserData.photoURL,
            text: text,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            isPPV: false,
            isPublic: true,
            likesCount: 0,
            commentsCount: 0,
            timestamp: serverTimestamp()
        };

        await addDoc(collection(db, "posts"), postData);

        // Atualizar contador de posts do usuário
        await updateDoc(doc(db, "users", currentUserId), {
            postsCount: increment(1)
        });

        // Limpar formulário
        userPostTextInput.value = '';
        selectedMedia = null;
        userMediaPreviewContainer.classList.add('hidden');
        userPostExpanded.classList.add('hidden');
        userMediaUploadInput.value = '';

        alert('Post publicado com sucesso!');
        await loadUserPosts(currentUserId);

    } catch (error) {
        console.error("Erro ao publicar post:", error);
        alert('Erro ao publicar post. Tente novamente.');
    } finally {
        userPublishPostBtn.disabled = false;
        userPublishPostBtn.textContent = 'Publicar';
    }
}

// Assistir anúncio
async function handleWatchAd() {
    try {
        // Simular assistir anúncio (em um app real, integraria com plataforma de anúncios)
        watchAdBtn.disabled = true;
        watchAdBtn.textContent = 'Assistindo...';

        // Simular tempo do anúncio
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Adicionar 5 mensagens gratuitas
        const today = new Date().toDateString();
        const userDocRef = doc(db, "users", currentUserId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const dailyMessagesUsed = userData.dailyMessagesUsed || {};
        const usedToday = dailyMessagesUsed[today] || 0;

        if (usedToday >= 5) { // Só pode usar anúncios se ainda tiver usado menos de 5 mensagens grátis
            const newUsed = Math.max(0, usedToday - 5);
            dailyMessagesUsed[today] = newUsed;

            await updateDoc(userDocRef, {
                dailyMessagesUsed: dailyMessagesUsed
            });

            alert('Você ganhou 5 mensagens gratuitas!');
            await loadChatSystem(currentUserId);
        } else {
            alert('Você já usou o máximo de anúncios hoje.');
        }

    } catch (error) {
        console.error("Erro ao assistir anúncio:", error);
        alert('Erro ao processar anúncio. Tente novamente.');
    } finally {
        watchAdBtn.disabled = false;
        watchAdBtn.textContent = 'Assistir Anúncio (+5 mensagens)';
    }
}

// Comprar mensagens
async function handleBuyMessages(messages, cost) {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUserId));
        const userData = userDoc.data();
        const currentCoins = userData.zafyreCoins || 0;

        if (currentCoins < cost) {
            alert('ZafyreCoins insuficientes. Compre mais na Zafyre Shop.');
            return;
        }

        // Deduzir coins e adicionar mensagens
        const today = new Date().toDateString();
        const dailyMessagesUsed = userData.dailyMessagesUsed || {};
        const usedToday = dailyMessagesUsed[today] || 0;
        const newUsed = Math.max(0, usedToday - messages);
        dailyMessagesUsed[today] = newUsed;

        await updateDoc(doc(db, "users", currentUserId), {
            zafyreCoins: currentCoins - cost,
            dailyMessagesUsed: dailyMessagesUsed
        });

        buyMessagesModal.classList.remove('visible');
        alert(`Você comprou ${messages} mensagens por ${cost} ZafyreCoins!`);
        await loadChatSystem(currentUserId);
        await loadUserWallet(currentUserId);

    } catch (error) {
        console.error("Erro ao comprar mensagens:", error);
        alert('Erro ao comprar mensagens. Tente novamente.');
    }
}

// Preencher formulário de edição
function fillEditForm() {
    document.getElementById('edit-user-display-name').value = currentUserData.displayName || '';
    document.getElementById('edit-user-bio').value = currentUserData.bio || '';
    document.getElementById('edit-user-avatar-preview').src = currentUserData.photoURL || 'default-avatar.png.jpg';
}

// Abrir modal do post
function openPostModal(post, postId) {
    // Implementar modal de visualização do post
    console.log('Abrir modal do post:', post, postId);
}

console.log("User Profile Male JS carregado");

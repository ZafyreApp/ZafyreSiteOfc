
// public/js/creator-profile.js

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    deleteDoc,
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
const CLOUDINARY_UPLOAD_PRESET = 'zafyre_creators_unsigned';

// Elementos da UI
const creatorAvatar = document.getElementById('creator-avatar');
const creatorDisplayName = document.getElementById('creator-display-name');
const creatorBio = document.getElementById('creator-bio');
const premiumCreatorBadge = document.getElementById('premium-creator-badge');
const creatorPostsCount = document.getElementById('creator-posts-count');
const creatorFollowersCount = document.getElementById('creator-followers-count');
const creatorLikesCount = document.getElementById('creator-likes-count');
const creatorEarnings = document.getElementById('creator-earnings');

// Elementos de criação de post
const creatorPostTextInput = document.getElementById('creator-post-text-input');
const creatorPostExpanded = document.getElementById('creator-post-expanded');
const creatorAddMediaBtn = document.getElementById('creator-add-media-btn');
const creatorPublishPostBtn = document.getElementById('creator-publish-post-btn');
const creatorMediaUploadInput = document.getElementById('creator-media-upload-input');
const creatorMediaPreviewContainer = document.getElementById('creator-media-preview-container');
const creatorMediaPreview = document.getElementById('creator-media-preview');
const creatorVideoPreview = document.getElementById('creator-video-preview');
const creatorRemoveMediaBtn = document.getElementById('creator-remove-media-btn');
const publicPostRadio = document.getElementById('public-post');
const ppvPostRadio = document.getElementById('ppv-post');
const creatorPpvPriceInput = document.getElementById('creator-ppv-price-input');
const creatorPpvPrice = document.getElementById('creator-ppv-price');

// Elementos de carteira
const creatorCoinsBalance = document.getElementById('creator-coins-balance');
const creatorRealBalance = document.getElementById('creator-real-balance');
const creatorWithdrawBtn = document.getElementById('creator-withdraw-btn');
const creatorFeeRate = document.getElementById('creator-fee-rate');

// Elementos de ranking
const creatorPosition = document.getElementById('creator-position');
const creatorRankPosition = document.getElementById('creator-rank-position');
const creatorsRankingList = document.getElementById('creators-ranking-list');

// Posts grid
const creatorPostsGrid = document.getElementById('creator-posts-grid');
const noCreatorPostsMessage = document.getElementById('no-creator-posts-message');

// Modal elements
const editCreatorProfileModal = document.getElementById('edit-creator-profile-modal');
const withdrawModal = document.getElementById('withdraw-modal');

let currentUserId = null;
let currentUserData = null;
let selectedMedia = null;

// Autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Criadora autenticada:", currentUserId);
        await loadCreatorProfile(currentUserId);
        await loadCreatorPosts(currentUserId);
        await loadCreatorWallet(currentUserId);
        await loadCreatorsRanking();
        setupEventListeners();
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando...");
        window.location.href = '/';
    }
});

// Carregar perfil da criadora
async function loadCreatorProfile(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUserData = userDocSnap.data();
            
            // Verificar se é criadora
            if (currentUserData.userType !== 'creator') {
                alert("Acesso negado. Esta página é apenas para criadoras.");
                window.location.href = 'user-profile-male.html';
                return;
            }

            creatorDisplayName.textContent = currentUserData.displayName || 'Criadora';
            creatorBio.textContent = currentUserData.bio || 'Sem biografia ainda.';
            creatorAvatar.src = currentUserData.photoURL || 'default-avatar.png.jpg';

            // Mostrar badge premium se aplicável
            if (currentUserData.isPremium) {
                premiumCreatorBadge.classList.remove('hidden');
                creatorFeeRate.textContent = '5%';
            } else {
                creatorFeeRate.textContent = '10%';
            }

            // Atualizar contadores
            creatorFollowersCount.textContent = currentUserData.followersCount || 0;
            creatorLikesCount.textContent = currentUserData.totalLikes || 0;

            // Atualizar avatar na caixa de criação
            document.getElementById('creator-avatar-create').src = currentUserData.photoURL || 'default-avatar.png.jpg';

        } else {
            console.warn("Documento da criadora não encontrado");
            await createCreatorProfile(userId);
        }
    } catch (error) {
        console.error("Erro ao carregar perfil da criadora:", error);
    }
}

// Criar perfil inicial da criadora
async function createCreatorProfile(userId) {
    try {
        const creatorData = {
            displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            email: auth.currentUser.email,
            photoURL: auth.currentUser.photoURL || 'default-avatar.png.jpg',
            bio: '',
            userType: 'creator',
            isPremium: false,
            followersCount: 0,
            followingCount: 0,
            totalLikes: 0,
            totalEarnings: 0,
            monthlyEarnings: 0,
            zafyreCoins: 0,
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, "users", userId), creatorData);
        console.log("Perfil de criadora criado com sucesso");
        await loadCreatorProfile(userId);
    } catch (error) {
        console.error("Erro ao criar perfil de criadora:", error);
    }
}

// Carregar posts da criadora
async function loadCreatorPosts(userId) {
    try {
        const postsQuery = query(
            collection(db, "posts"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(postsQuery);

        creatorPostsGrid.innerHTML = '';

        if (querySnapshot.empty) {
            noCreatorPostsMessage.classList.remove('hidden');
            creatorPostsCount.textContent = 0;
            return;
        }

        noCreatorPostsMessage.classList.add('hidden');
        creatorPostsCount.textContent = querySnapshot.docs.length;

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = createCreatorPostThumbnail(post, doc.id);
            creatorPostsGrid.appendChild(postElement);
        });

    } catch (error) {
        console.error("Erro ao carregar posts da criadora:", error);
    }
}

// Criar miniatura do post
function createCreatorPostThumbnail(post, postId) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post-thumbnail');
    
    if (post.isPPV) {
        postDiv.classList.add('ppv-post');
    }

    if (post.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = post.mediaUrl;
        video.controls = false;
        video.muted = true;
        postDiv.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = post.mediaUrl;
        img.alt = 'Post da criadora';
        postDiv.appendChild(img);
    }

    // Adicionar overlay para PPV
    if (post.isPPV) {
        const overlay = document.createElement('div');
        overlay.classList.add('ppv-overlay');
        overlay.innerHTML = `
            <div class="ppv-info">
                <span class="ppv-price">R$ ${post.ppvPrice?.toFixed(2) || '0,00'}</span>
                <span class="ppv-label">PPV</span>
            </div>
        `;
        postDiv.appendChild(overlay);
    }

    postDiv.addEventListener('click', () => {
        openPostModal(post, postId);
    });

    return postDiv;
}

// Carregar carteira da criadora
async function loadCreatorWallet(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const coins = userData.zafyreCoins || 0;
            const realValue = coins * 0.05; // 1 ZafyreCoin = R$ 0,05

            creatorCoinsBalance.textContent = coins.toLocaleString();
            creatorRealBalance.textContent = `R$ ${realValue.toFixed(2)}`;
            creatorEarnings.textContent = `R$ ${(userData.monthlyEarnings || 0).toFixed(2)}`;

            // Habilitar saque se tiver mais de R$ 50
            if (realValue >= 50) {
                creatorWithdrawBtn.disabled = false;
            } else {
                creatorWithdrawBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar carteira:", error);
    }
}

// Carregar ranking de criadoras
async function loadCreatorsRanking() {
    try {
        const rankingQuery = query(
            collection(db, "users"),
            where("userType", "==", "creator"),
            orderBy("weeklyEarnings", "desc"),
            limit(10)
        );
        const querySnapshot = await getDocs(rankingQuery);

        creatorsRankingList.innerHTML = '';
        let currentUserPosition = null;

        querySnapshot.forEach((doc, index) => {
            const creator = doc.data();
            const position = index + 1;

            if (doc.id === currentUserId) {
                currentUserPosition = position;
            }

            const rankingItem = createRankingItem(creator, position, doc.id);
            creatorsRankingList.appendChild(rankingItem);
        });

        // Mostrar posição do usuário atual
        if (currentUserPosition) {
            creatorPosition.classList.remove('hidden');
            creatorRankPosition.textContent = `#${currentUserPosition}`;
        }

    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
        creatorsRankingList.innerHTML = '<p class="error-message">Erro ao carregar ranking</p>';
    }
}

// Criar item do ranking
function createRankingItem(creator, position, creatorId) {
    const item = document.createElement('div');
    item.classList.add('ranking-item');
    
    if (creatorId === currentUserId) {
        item.classList.add('current-user');
    }

    item.innerHTML = `
        <div class="ranking-position">${position}</div>
        <img src="${creator.photoURL || 'default-avatar.png.jpg'}" alt="${creator.displayName}" class="ranking-avatar">
        <div class="ranking-info">
            <div class="ranking-name">${creator.displayName || 'Criadora'}</div>
            <div class="ranking-stats">R$ ${(creator.weeklyEarnings || 0).toFixed(2)} esta semana</div>
        </div>
    `;

    return item;
}

// Configurar event listeners
function setupEventListeners() {
    // Expandir caixa de criação de post
    document.querySelector('.create-post-input').addEventListener('click', () => {
        creatorPostExpanded.classList.remove('hidden');
        creatorPostTextInput.focus();
    });

    // Input de texto do post
    creatorPostTextInput.addEventListener('input', () => {
        const hasText = creatorPostTextInput.value.trim().length > 0;
        const hasMedia = selectedMedia !== null;
        creatorPublishPostBtn.disabled = !(hasText || hasMedia);
    });

    // Radio buttons para tipo de post
    ppvPostRadio.addEventListener('change', () => {
        if (ppvPostRadio.checked) {
            creatorPpvPriceInput.classList.remove('hidden');
        }
    });

    publicPostRadio.addEventListener('change', () => {
        if (publicPostRadio.checked) {
            creatorPpvPriceInput.classList.add('hidden');
        }
    });

    // Botão de adicionar mídia
    creatorAddMediaBtn.addEventListener('click', () => {
        creatorMediaUploadInput.click();
    });

    // Upload de mídia
    creatorMediaUploadInput.addEventListener('change', handleMediaUpload);

    // Remover mídia
    creatorRemoveMediaBtn.addEventListener('click', () => {
        selectedMedia = null;
        creatorMediaPreviewContainer.classList.add('hidden');
        creatorMediaPreview.style.display = 'none';
        creatorVideoPreview.style.display = 'none';
        creatorMediaUploadInput.value = '';
        
        const hasText = creatorPostTextInput.value.trim().length > 0;
        creatorPublishPostBtn.disabled = !hasText;
    });

    // Publicar post
    creatorPublishPostBtn.addEventListener('click', handlePublishPost);

    // Botão de saque
    creatorWithdrawBtn.addEventListener('click', () => {
        withdrawModal.classList.add('visible');
    });

    // Filtros de posts
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterPosts(e.target.dataset.filter);
        });
    });

    // Modal de edição de perfil
    document.getElementById('edit-creator-profile-btn').addEventListener('click', () => {
        editCreatorProfileModal.classList.add('visible');
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
                creatorMediaUploadInput.value = '';
                return;
            }
        });
    }

    selectedMedia = file;
    
    // Mostrar prévia
    if (file.type.startsWith('image/')) {
        creatorMediaPreview.src = URL.createObjectURL(file);
        creatorMediaPreview.style.display = 'block';
        creatorVideoPreview.style.display = 'none';
    } else if (file.type.startsWith('video/')) {
        creatorVideoPreview.src = URL.createObjectURL(file);
        creatorVideoPreview.style.display = 'block';
        creatorMediaPreview.style.display = 'none';
    }

    creatorMediaPreviewContainer.classList.remove('hidden');
    creatorPublishPostBtn.disabled = false;
}

// Publicar post
async function handlePublishPost() {
    const text = creatorPostTextInput.value.trim();
    const isPPV = ppvPostRadio.checked;
    const ppvPrice = isPPV ? parseFloat(creatorPpvPrice.value) : null;

    if (!text && !selectedMedia) {
        alert('Adicione texto ou mídia para publicar.');
        return;
    }

    if (isPPV && (!ppvPrice || ppvPrice < 1.99)) {
        alert('Preço PPV deve ser no mínimo R$ 1,99');
        return;
    }

    creatorPublishPostBtn.disabled = true;
    creatorPublishPostBtn.textContent = 'Publicando...';

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
            isPPV: isPPV,
            ppvPrice: ppvPrice,
            isPublic: !isPPV, // Posts PPV não aparecem no feed público
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
        creatorPostTextInput.value = '';
        selectedMedia = null;
        creatorMediaPreviewContainer.classList.add('hidden');
        creatorPostExpanded.classList.add('hidden');
        publicPostRadio.checked = true;
        creatorPpvPriceInput.classList.add('hidden');
        creatorMediaUploadInput.value = '';

        alert('Post publicado com sucesso!');
        await loadCreatorPosts(currentUserId);

    } catch (error) {
        console.error("Erro ao publicar post:", error);
        alert('Erro ao publicar post. Tente novamente.');
    } finally {
        creatorPublishPostBtn.disabled = false;
        creatorPublishPostBtn.textContent = 'Publicar';
    }
}

// Filtrar posts
function filterPosts(filter) {
    const posts = creatorPostsGrid.querySelectorAll('.post-thumbnail');
    
    posts.forEach(post => {
        switch (filter) {
            case 'all':
                post.style.display = 'block';
                break;
            case 'public':
                if (post.classList.contains('ppv-post')) {
                    post.style.display = 'none';
                } else {
                    post.style.display = 'block';
                }
                break;
            case 'ppv':
                if (post.classList.contains('ppv-post')) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
                break;
        }
    });
}

// Preencher formulário de edição
function fillEditForm() {
    document.getElementById('edit-creator-display-name').value = currentUserData.displayName || '';
    document.getElementById('edit-creator-bio').value = currentUserData.bio || '';
    document.getElementById('edit-creator-avatar-preview').src = currentUserData.photoURL || 'default-avatar.png.jpg';
}

// Abrir modal do post
function openPostModal(post, postId) {
    // Implementar modal de visualização do post
    console.log('Abrir modal do post:', post, postId);
}

console.log("Creator Profile JS carregado");

// public/js/feed.js

// Importações necessárias para Firestore (comentários, likes, posts) e Auth
import { 
    getFirestore, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    startAfter, 
    doc, 
    getDoc, 
    addDoc, 
    setDoc, 
    serverTimestamp, 
    updateDoc, 
    increment,
    onSnapshot, 
    where, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Elementos da UI do Feed de Posts
const postsContainer = document.getElementById('posts-container');
const loadingMessage = postsContainer.querySelector('.loading-message');
const noPostsMessage = document.getElementById('no-posts-message');
const loadingMorePostsMessage = document.getElementById('loading-more-posts');
const trendingUsersContainer = document.getElementById('trending-users');
const userAvatarCreate = document.getElementById('user-avatar-create');

// Elementos da UI do Modal de Comentários
const commentsModal = document.getElementById('comments-modal');
const closeCommentsModalButton = document.getElementById('close-comments-modal');
const commentsList = document.getElementById('comments-list');
const noCommentsMessageInModal = document.getElementById('no-comments-message'); 
const loadingCommentsMessage = commentsList.querySelector('.loading-comments-message');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');

// Variáveis de Estado
let lastVisible = null; 
const postsPerPage = 5;
let isLoadingPosts = false; 

let currentUserId = null;
let currentPostIdForComments = null; 
let unsubscribeComments = null; 

// Array para armazenar os IDs dos usuários que o usuário logado segue
let followingUserIds = []; 
const MAX_FOLLOWING_IDS_FOR_QUERY = 10; // Limite do Firestore para consultas 'in'

// Conjunto para armazenar IDs de posts que o usuário logado já curtiu
// Isso será populado ao carregar posts para renderizar corretamente os botões de like
let likedPosts = new Set(); 

// --- SVG Icons (Embutidos diretamente no JavaScript) ---
// SVG do coração VAZIO (o mesmo que você provavelmente tem em 'icons/heart.svg')
const heartSvgEmpty = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
`;

// SVG do coração PREENCHIDO
const heartSvgFilled = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart-filled">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
`;


// --- Autenticação e Carregamento Inicial ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado no Feed:", currentUserId);

        // Carregar avatar do usuário para o box de criar post
        if (userAvatarCreate) {
            userAvatarCreate.src = user.photoURL || 'default-avatar.png.jpg';
        }

        await loadFollowingUsers(currentUserId); // Carregar quem o usuário segue primeiro
        loadTrendingUsers(); // Carregar usuários em alta
        loadPosts(); // Carregar posts (agora filtrados e com status de like)
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/';
    }
});

// Função para carregar os IDs dos usuários que o usuário logado segue
async function loadFollowingUsers(userId) {
    try {
        const followingCollectionRef = collection(db, "users", userId, "following");
        const querySnapshot = await getDocs(followingCollectionRef);
        followingUserIds = []; // Limpa array antes de preencher
        querySnapshot.forEach(doc => {
            followingUserIds.push(doc.id);
        });
        console.log("Usuários seguidos por", userId, ":", followingUserIds);

        // Adiciona o próprio ID do usuário para ver seus próprios posts no feed
        followingUserIds.push(userId); 

        // Se o número de seguidos for maior que o limite do 'in'
        if (followingUserIds.length > MAX_FOLLOWING_IDS_FOR_QUERY) {
            console.warn(`Número de usuários seguidos (${followingUserIds.length}) excede o limite do Firestore (${MAX_FOLLOWING_IDS_FOR_QUERY}) para consultas 'in'. O feed mostrará posts de um subconjunto.`);
            followingUserIds = followingUserIds.slice(0, MAX_FOLLOWING_IDS_FOR_QUERY);
        }

    } catch (error) {
        console.error("Erro ao carregar usuários seguidos:", error);
        followingUserIds = [userId]; // Pelo menos garante que o próprio usuário veja seus posts
    }
}

// Função para buscar usuários
async function searchUsers(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById('search-results').classList.add('hidden');
        return;
    }

    const searchResults = document.getElementById('search-results');

    try {
        // Remove @ se presente
        const cleanTerm = searchTerm.replace('@', '').toLowerCase();

        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('displayName'), limit(10));
        const querySnapshot = await getDocs(q);

        searchResults.innerHTML = '';

        if (querySnapshot.empty) {
            searchResults.innerHTML = '<div class="search-result-item">Nenhum usuário encontrado</div>';
        } else {
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                const userId = doc.id;

                // Filtrar por nome ou username
                if (user.displayName?.toLowerCase().includes(cleanTerm) || 
                    user.username?.toLowerCase().includes(cleanTerm)) {

                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.innerHTML = `
                        <img src="${user.photoURL || 'default-avatar.png.jpg'}" alt="${user.displayName}" class="search-result-avatar">
                        <div class="search-result-info">
                            <div class="search-result-name">${user.displayName || 'Usuário'}</div>
                            <div class="search-result-username">@${user.username || userId}</div>
                        </div>
                    `;

                    resultItem.addEventListener('click', () => {
                        window.location.href = `user-profile.html?userId=${userId}`;
                    });

                    searchResults.appendChild(resultItem);
                }
            });
        }

        searchResults.classList.remove('hidden');

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        searchResults.innerHTML = '<div class="search-result-item">Erro ao buscar usuários</div>';
        searchResults.classList.remove('hidden');
    }
}

// --- Função Principal para Carregar Posts ---
async function loadPosts() {
    if (isLoadingPosts) return;
    isLoadingPosts = true;

    if (loadingMorePostsMessage) loadingMorePostsMessage.classList.remove('hidden');

    if (postsContainer.children.length > 0 && postsContainer.querySelector('.post-card')) { 
        if (loadingMessage) loadingMessage.classList.add('hidden');
    } else {
        if (loadingMessage) loadingMessage.classList.remove('hidden');
    }
    if (noPostsMessage) noPostsMessage.classList.add('hidden');

    let postsQuery;
    let baseQuery = collection(db, "posts");

    // Adicionar filtro por usuários seguidos
    if (followingUserIds.length > 0) {
        baseQuery = query(baseQuery, where("userId", "in", followingUserIds));
    } else {
        if (loadingMessage) loadingMessage.classList.add('hidden');
        if (loadingMorePostsMessage) loadingMorePostsMessage.classList.add('hidden');
        if (noPostsMessage) noPostsMessage.classList.remove('hidden');
        noPostsMessage.textContent = 'Siga pessoas para ver publicações aqui! Explore para encontrar novos conteúdos.';
        isLoadingPosts = false;
        return;
    }

    if (lastVisible) {
        postsQuery = query(
            baseQuery,
            orderBy("timestamp", "desc"),
            startAfter(lastVisible),
            limit(postsPerPage)
        );
    } else {
        postsQuery = query(
            baseQuery,
            orderBy("timestamp", "desc"),
            limit(postsPerPage)
        );
    }

    try {
        const querySnapshot = await getDocs(postsQuery);

        if (loadingMessage) loadingMessage.classList.add('hidden');
        if (loadingMorePostsMessage) loadingMorePostsMessage.classList.add('hidden');

        if (querySnapshot.empty && !lastVisible) {
            if (noPostsMessage) noPostsMessage.classList.remove('hidden');
            noPostsMessage.textContent = 'Nenhuma publicação de quem você segue foi encontrada.';
            isLoadingPosts = false;
            return;
        }

        if (querySnapshot.empty) {
            console.log("Não há mais posts para carregar de quem você segue.");
            isLoadingPosts = false;
            return;
        }

        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        // NOVO: Limpar o conjunto de curtidas para os posts que estão sendo carregados
        // Se você estiver implementando um "scroll infinito", você pode querer manter os likes existentes
        // e apenas adicionar/atualizar, mas para começar, limpar é mais simples e seguro.
        likedPosts.clear(); 

        for (const postDoc of querySnapshot.docs) {
            const post = postDoc.data();
            const postId = postDoc.id;

            // NOVO: Verificar se o usuário logado curtiu este post
            if (currentUserId) {
                const likeDocRef = doc(db, "posts", postId, "likes", currentUserId);
                const likeDocSnap = await getDoc(likeDocRef);
                if (likeDocSnap.exists()) {
                    likedPosts.add(postId);
                }
            }

            let authorName = "Usuário Desconhecido";
            let authorAvatar = 'default-avatar.png.jpg'; 

            if (post.userId) {
                const userDocRef = doc(db, "users", post.userId);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        authorName = userData.displayName || authorName;
                        authorAvatar = userData.photoURL || authorAvatar; 
                    } else {
                        if (post.userId === currentUserId && auth.currentUser) {
                            authorName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
                            authorAvatar = auth.currentUser.photoURL || 'default-avatar.png.jpg';
                        }
                    }
                } catch (userError) {
                    console.error(`Erro ao buscar dados do usuário ${post.userId}:`, userError);
                }
            }

            const postCard = createPostCard(post, authorName, authorAvatar, postId);
            postsContainer.appendChild(postCard);
        }

    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        if (loadingMessage) loadingMessage.classList.add('hidden');
        if (loadingMorePostsMessage) loadingMorePostsMessage.classList.add('hidden');
        if (noPostsMessage) noPostsMessage.classList.remove('hidden');
        if (noPostsMessage) noPostsMessage.textContent = 'Erro ao carregar posts. Tente novamente mais tarde.';
    } finally {
        isLoadingPosts = false;
    }
}

// --- Função para Criar um Card de Postagem (UI) ---
function createPostCard(post, authorName, authorAvatar, postId) {
    const postCard = document.createElement('article');
    postCard.classList.add('post-card');
    postCard.dataset.postId = postId;

    const postTime = post.timestamp ? formatTimeAgo(post.timestamp.toDate()) : 'Agora pouco';
    const mediaElement = post.mediaType === 'video' ? 
        `<video controls class="post-video"><source src="${post.mediaUrl}" type="video/mp4">Seu navegador não suporta vídeos.</video>` :
        `<img src="${post.mediaUrl}" alt="Imagem do Post" class="post-image">`;

    const likesCount = post.likesCount || 0;
    const commentsCount = post.commentsCount || 0;

    // Adiciona classe 'liked' e define o SVG correto
    const likeButtonClass = likedPosts.has(postId) ? 'action-icon-button like-button liked' : 'action-icon-button like-button';
    const currentHeartSvg = likedPosts.has(postId) ? heartSvgFilled : heartSvgEmpty;

    postCard.innerHTML = `
        <div class="post-header">
            <a href="user-profile.html?userId=${post.userId}" class="author-link"> 
                <img src="${authorAvatar}" alt="Avatar do Usuário" class="post-avatar">
                <span class="post-username">${authorName}</span>
            </a>
            <span class="post-time">${postTime}</span>
        </div>
        <div class="post-media">
            ${mediaElement}
        </div>
        <div class="post-actions">
            <button class="${likeButtonClass}">${currentHeartSvg}</button> <button class="action-icon-button comment-button"><img src="icons/comment.svg" alt="Comentar"></button>
            <button class="action-icon-button share-button"><img src="icons/share.svg" alt="Compartilhar"></button>
        </div>
        <div class="post-likes">
            <span class="likes-counter">${likesCount}</span> curtidas
        </div>
        <div class="post-caption">
            <a href="user-profile.html?userId=${post.userId}" class="caption-author-link">
                <span class="post-username">${authorName}</span>
            </a>
            <p class="caption-text">${post.caption || ''}</p>
        </div>
        <div class="post-comments-summary">
            <a href="#" class="view-comments-link">Ver todos os <span class="comments-counter">${commentsCount}</span> comentários</a>
        </div>
    `;

    // Adiciona listeners para os botões de ação
    const likeButton = postCard.querySelector('.like-button');
    likeButton.addEventListener('click', () => handleLike(postId, likeButton, postCard.querySelector('.likes-counter')));

    const commentButton = postCard.querySelector('.comment-button');
    const viewCommentsLink = postCard.querySelector('.view-comments-link');

    commentButton.addEventListener('click', () => openCommentsModal(postId));
    viewCommentsLink.addEventListener('click', (e) => {
        e.preventDefault(); 
        openCommentsModal(postId);
    });

    postCard.querySelector('.share-button').addEventListener('click', () => console.log('Compartilhar post:', postId));

    return postCard;
}

// --- Paginação (Carregar mais posts ao rolar) ---
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY + 500) >= document.body.offsetHeight && !isLoadingPosts) {
        console.log("Quase no final da página. Carregando mais posts...");
        loadPosts();
    }
});

// --- Lógica de Likes (AGORA MAIS ROBUSTA) ---
async function handleLike(postId, likeButtonElement, likesCounterElement) {
    if (!currentUserId) {
        alert("Faça login para curtir posts.");
        return;
    }

    likeButtonElement.disabled = true; // Desabilita o botão para evitar cliques múltiplos

    const likeDocRef = doc(db, "posts", postId, "likes", currentUserId);
    const postRef = doc(db, "posts", postId);

    try {
        const likeDocSnap = await getDoc(likeDocRef);

        if (likeDocSnap.exists()) {
            // Usuário já curtiu, então descurtir
            await deleteDoc(likeDocRef);
            await updateDoc(postRef, {
                likesCount: increment(-1)
            });
            likedPosts.delete(postId); // Remove do Set local

            // Atualiza UI: Troca o SVG para vazio
            likeButtonElement.classList.remove('liked');
            likeButtonElement.innerHTML = heartSvgEmpty; // ALTERADO AQUI
            let currentLikes = parseInt(likesCounterElement.textContent);
            likesCounterElement.textContent = currentLikes - 1;
            console.log(`Post ${postId} descurtido por ${currentUserId}`);
        } else {
            // Usuário não curtiu, então curtir
            await setDoc(likeDocRef, { 
                userId: currentUserId,
                timestamp: serverTimestamp()
            });
            await updateDoc(postRef, {
                likesCount: increment(1)
            });
            likedPosts.add(postId); // Adiciona ao Set local

            // Atualiza UI: Troca o SVG para preenchido
            likeButtonElement.classList.add('liked');
            likeButtonElement.innerHTML = heartSvgFilled; // ALTERADO AQUI
            let currentLikes = parseInt(likesCounterElement.textContent);
            likesCounterElement.textContent = currentLikes + 1;
            console.log(`Post ${postId} curtido por ${currentUserId}`);
        }
    } catch (error) {
        console.error("Erro ao curtir/descurtir post:", error);
        alert("Não foi possível realizar a ação. Tente novamente.");
    } finally {
        likeButtonElement.disabled = false; // Reabilita o botão
    }
}

// --- Lógica do Modal de Comentários ---
async function openCommentsModal(postId) {
    currentPostIdForComments = postId;
    commentsModal.classList.add('visible'); 

    commentsList.innerHTML = '';
    if (loadingCommentsMessage) loadingCommentsMessage.classList.remove('hidden');
    if (noCommentsMessageInModal) noCommentsMessageInModal.classList.add('hidden'); 

    if (unsubscribeComments) {
        unsubscribeComments();
    }

    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const q = query(commentsCollectionRef, orderBy("timestamp", "asc"));

    unsubscribeComments = onSnapshot(q, async (snapshot) => {
        commentsList.innerHTML = ''; 
        if (loadingCommentsMessage) loadingCommentsMessage.classList.add('hidden');

        if (snapshot.empty) {
            if (noCommentsMessageInModal) noCommentsMessageInModal.classList.remove('hidden'); 
            return;
        }

        if (noCommentsMessageInModal) noCommentsMessageInModal.classList.add('hidden'); 

        for (const commentDoc of snapshot.docs) {
            const comment = commentDoc.data();
            let commentAuthorName = "Usuário Desconhecido";
            let commentAuthorAvatar = 'default-avatar.png.jpg'; 

            if (comment.userId) {
                const userDocRef = doc(db, "users", comment.userId);
                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        commentAuthorName = userData.displayName || commentAuthorName;
                        commentAuthorAvatar = userData.photoURL || commentAuthorAvatar;
                    }
                } catch (userError) {
                    console.error(`Erro ao buscar dados do usuário do comentário ${comment.userId}:`, userError);
                }
            }

            const commentItem = document.createElement('div');
            commentItem.classList.add('comment-item');

            const commentTime = comment.timestamp ? formatTimeAgo(comment.timestamp.toDate()) : 'Agora pouco';

            commentItem.innerHTML = `
                <a href="user-profile.html?userId=${comment.userId}" class="comment-author-link">
                    <img src="${commentAuthorAvatar}" alt="Avatar" class="comment-avatar">
                    <span class="comment-username">${commentAuthorName}</span>
                </a>
                <div class="comment-content">
                    <span class="comment-text">${comment.commentText}</span>
                    <span class="comment-time">${commentTime}</span>
                </div>
            `;
            commentsList.appendChild(commentItem);
        }
        commentsList.scrollTop = commentsList.scrollHeight;
    }, (error) => {
        console.error("Erro ao carregar comentários:", error);
        if (loadingCommentsMessage) loadingCommentsMessage.classList.add('hidden');
        if (noCommentsMessageInModal) noCommentsMessageInModal.classList.remove('hidden'); 
        if (noCommentsMessageInModal) noCommentsMessageInModal.textContent = 'Erro ao carregar comentários.';
    });
}

// Fechar o modal de comentários
closeCommentsModalButton.addEventListener('click', () => {
    commentsModal.classList.remove('visible');
    currentPostIdForComments = null;
    if (unsubscribeComments) {
        unsubscribeComments(); 
    }
});

// Enviar Comentário
commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const commentText = commentInput.value.trim();

    if (commentText === '' || !currentPostIdForComments || !currentUserId) {
        return;
    }

    try {
        await addDoc(collection(db, "posts", currentPostIdForComments, "comments"), {
            userId: currentUserId,
            commentText: commentText,
            timestamp: serverTimestamp()
        });

        const postRef = doc(db, "posts", currentPostIdForComments);
        await updateDoc(postRef, {
            commentsCount: increment(1)
        });

        const postCardElement = document.querySelector(`.post-card[data-post-id="${currentPostIdForComments}"]`);
        if (postCardElement) {
            const commentsCounterElement = postCardElement.querySelector('.comments-counter');
            if (commentsCounterElement) {
                let currentComments = parseInt(commentsCounterElement.textContent);
                commentsCounterElement.textContent = currentComments + 1;
            }
        }

        commentInput.value = '';
    } catch (error) {
        console.error("Erro ao enviar comentário:", error);
        alert("Não foi possível enviar o comentário. Tente novamente.");
    }
});

// --- Função para Carregar Usuários em Alta ---
async function loadTrendingUsers() {
    if (!trendingUsersContainer) return;

    try {
        // Buscar usuários com mais seguidores (limitado a 10)
        const usersQuery = query(
            collection(db, "users"),
            limit(10)
        );

        const querySnapshot = await getDocs(usersQuery);
        trendingUsersContainer.innerHTML = '';

        for (const userDoc of querySnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Não mostrar o próprio usuário
            if (userId === currentUserId) continue;

            const trendingUser = document.createElement('a');
            trendingUser.href = `user-profile.html?userId=${userId}`;
            trendingUser.className = 'trending-user';

            trendingUser.innerHTML = `
                <img src="${userData.photoURL || 'default-avatar.png.jpg'}" alt="Avatar" class="trending-avatar">
                <span class="trending-username">${userData.displayName || 'Usuário'}</span>
            `;

            trendingUsersContainer.appendChild(trendingUser);
        }

    } catch (error) {
        console.error("Erro ao carregar usuários em alta:", error);
        if (trendingUsersContainer) {
            trendingUsersContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Erro ao carregar usuários</p>';
        }
    }
}

// --- Função Utilitária para Formatar Tempo (Ex: "5 minutos atrás") ---
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000; 
    if (interval > 1) return Math.floor(interval) + " ano(s) atrás";
    interval = seconds / 2592000; 
    if (interval > 1) return Math.floor(interval) + " mês(es) atrás";
    interval = seconds / 86400; 
    if (interval > 1) return Math.floor(interval) + " dia(s) atrás";
    interval = seconds / 3600; 
    if (interval > 1) return Math.floor(interval) + " hora(s) atrás";
    interval = seconds / 60; 
    if (interval > 1) return Math.floor(interval) + " minuto(s) atrás";
    return "agora mesmo";
}

// Inicialização quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, configurando eventos de autenticação...');

    // Configurar busca de usuários
    const searchInput = document.getElementById('user-search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.trim();

            if (searchTerm.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.add('hidden');
                return;
            }

            searchTimeout = setTimeout(() => {
                searchUsers(searchTerm);
            }, 300);
        });
    }

    // Configurar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = '/';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao sair da conta. Tente novamente.');
            }
        });
    }
});

// Função para buscar usuários
async function searchUsers(searchTerm) {
    const searchResults = document.getElementById('search-results');

    try {
        // Buscar por displayName que comece com o termo
        const usersQuery = query(
            collection(db, "users"),
            where("displayName", ">=", searchTerm),
            where("displayName", "<=", searchTerm + '\uf8ff'),
            limit(10)
        );

        const querySnapshot = await getDocs(usersQuery);

        searchResults.innerHTML = '';

        if (querySnapshot.empty) {
            searchResults.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 12px;">Nenhum usuário encontrado</p>';
        } else {
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const userId = doc.id;

                if (userId !== currentUserId) { // Não mostrar o próprio usuário
                    const resultItem = createSearchResultItem(userData, userId);
                    searchResults.appendChild(resultItem);
                }
            });
        }

        searchResults.classList.remove('hidden');

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        searchResults.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 12px;">Erro ao buscar usuários</p>';
        searchResults.classList.remove('hidden');
    }
}

// Criar item de resultado da busca
function createSearchResultItem(userData, userId) {
    const item = document.createElement('div');
    item.classList.add('search-result-item');

    item.innerHTML = `
        <img src="${userData.profilePicture || 'default-avatar.png.jpg'}" alt="${userData.displayName}" class="search-result-avatar">
        <div class="search-result-info">
            <div class="search-result-name">${userData.displayName || 'Usuário'}</div>
            <div class="search-result-username">@${userData.displayName?.toLowerCase().replace(/\s+/g, '') || 'usuario'}</div>
        </div>
    `;

    item.addEventListener('click', () => {
        window.location.href = `user-profile.html?userId=${userId}`;
    });

    return item;
}

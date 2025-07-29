// public/js/explore.js

import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Elementos da UI
const explorePostsGrid = document.getElementById('explore-posts-grid');
const noExplorePostsMessage = document.getElementById('no-explore-posts-message');
const loadingSpinner = explorePostsGrid.querySelector('.loading-spinner'); // O spinner deve estar dentro de explore-posts-grid

let currentUserId = null; // Para verificar se o usuário está logado

// --- Autenticação e Carregamento Inicial ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado na tela de Explorar:", currentUserId);
        await loadExplorePosts();
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/'; // Redireciona para a página de login
    }
});

// --- Carregar Posts para a tela de Exploração ---
async function loadExplorePosts() {
    explorePostsGrid.innerHTML = ''; // Limpa posts anteriores
    noExplorePostsMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        const postsQuery = query(
            collection(db, "posts"),
            orderBy("timestamp", "desc") // Ou "likesCount", "desc" se quiser ordenar por popularidade e tiver o campo
        );
        const querySnapshot = await getDocs(postsQuery);

        loadingSpinner.classList.add('hidden');

        if (querySnapshot.empty) {
            noExplorePostsMessage.classList.remove('hidden');
            return;
        }

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            const postThumbnail = createPostThumbnail(post, postId); // Passa o postId
            explorePostsGrid.appendChild(postThumbnail);
        });

    } catch (error) {
        console.error("Erro ao carregar posts de exploração:", error);
        noExplorePostsMessage.classList.remove('hidden');
        noExplorePostsMessage.textContent = 'Erro ao carregar publicações para explorar.';
        loadingSpinner.classList.add('hidden');
    }
}

// --- Criar Miniatura do Post (reutilizada de my-profile.js, mas com link) ---
function createPostThumbnail(post, postId) {
    const postThumbnailDiv = document.createElement('div');
    postThumbnailDiv.classList.add('post-thumbnail');

    let mediaElement;
    if (post.mediaType === 'video') {
        mediaElement = document.createElement('video');
        mediaElement.src = post.mediaUrl;
        mediaElement.controls = false; 
        mediaElement.autoplay = false;
        mediaElement.muted = true;
        mediaElement.loop = true;
        postThumbnailDiv.appendChild(mediaElement);
        // Opcional: Adicionar um ícone de play sobreposto (se você tiver o SVG)
        // postThumbnailDiv.innerHTML += '<img src="icons/play-button.svg" alt="Vídeo" class="video-play-icon">';
    } else {
        mediaElement = document.createElement('img');
        mediaElement.src = post.mediaUrl;
        mediaElement.alt = 'Miniatura do Post';
        postThumbnailDiv.appendChild(mediaElement);
    }

    // Adiciona um link para o perfil do usuário ao clicar na miniatura (ou para um modal de post detalhado)
    // Por enquanto, vamos para o perfil do autor. Depois, podemos pensar em um modal de visualização.
    postThumbnailDiv.addEventListener('click', () => {
        // Redireciona para o perfil do autor do post
        window.location.href = `user-profile.html?userId=${post.userId}`;
        console.log("Clicou no post de exploração. Indo para o perfil do autor:", post.userId);
        // Se você quiser abrir um modal de visualização do post, a lógica seria aqui:
        // openPostDetailModal(postId);
    });

    return postThumbnailDiv;
}
// public/js/explore.js

import { 
    getFirestore, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Elementos da UI
const explorePostsGrid = document.getElementById('explore-posts-grid');
const noExplorePostsMessage = document.getElementById('no-explore-posts-message');
const loadingSpinner = document.querySelector('.loading-spinner');

let currentUserId = null;

// Autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado na página Explorar:", currentUserId);
        loadExplorePosts();
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/';
    }
});

// Função para carregar posts para explorar
async function loadExplorePosts() {
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (noExplorePostsMessage) noExplorePostsMessage.classList.add('hidden');

    try {
        // Buscar posts mais recentes ou populares
        const postsQuery = query(
            collection(db, "posts"),
            orderBy("timestamp", "desc"),
            limit(20) // Limitar a 20 posts para não sobrecarregar
        );

        const querySnapshot = await getDocs(postsQuery);
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (querySnapshot.empty) {
            if (noExplorePostsMessage) {
                noExplorePostsMessage.classList.remove('hidden');
                noExplorePostsMessage.textContent = 'Nenhuma publicação encontrada para explorar.';
            }
            return;
        }

        explorePostsGrid.innerHTML = '';

        for (const postDoc of querySnapshot.docs) {
            const post = postDoc.data();
            const postId = postDoc.id;

            // Buscar informações do autor
            let authorName = "Usuário Desconhecido";
            if (post.userId) {
                try {
                    const userDocRef = doc(db, "users", post.userId);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        authorName = userData.displayName || authorName;
                    }
                } catch (userError) {
                    console.error(`Erro ao buscar dados do usuário ${post.userId}:`, userError);
                }
            }

            const postThumbnail = createPostThumbnail(post, authorName, postId);
            explorePostsGrid.appendChild(postThumbnail);
        }

    } catch (error) {
        console.error("Erro ao carregar posts para explorar:", error);
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (noExplorePostsMessage) {
            noExplorePostsMessage.classList.remove('hidden');
            noExplorePostsMessage.textContent = 'Erro ao carregar posts. Tente novamente mais tarde.';
        }
    }
}

// Função para criar thumbnail do post
function createPostThumbnail(post, authorName, postId) {
    const thumbnail = document.createElement('div');
    thumbnail.classList.add('explore-post-thumbnail');
    thumbnail.setAttribute('data-post-id', postId);

    const mediaElement = post.mediaType === 'video' ? 
        `<video><source src="${post.mediaUrl}" type="video/mp4"></video>` :
        `<img src="${post.mediaUrl}" alt="Post de ${authorName}">`;

    thumbnail.innerHTML = mediaElement;

    // Adicionar evento de clique para abrir o post (pode implementar modal depois)
    thumbnail.addEventListener('click', () => {
        console.log('Clicou no post:', postId);
        // Aqui você pode implementar a abertura de um modal com o post completo
        // ou redirecionamento para uma página de detalhes do post
    });

    return thumbnail;
}

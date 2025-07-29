// public/js/user-profile.js

import { 
    getFirestore, 
    doc, 
    getDoc, 
    query, 
    collection, 
    where, 
    orderBy, 
    getDocs, 
    setDoc, // Importe setDoc para criar documentos
    deleteDoc, // Importe deleteDoc para deletar documentos
    updateDoc, // Importe updateDoc para atualizar contadores
    increment, // Importe increment para aumentar/diminuir contadores
    serverTimestamp // Importe serverTimestamp para marcar a hora da ação
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Elementos da UI do Perfil
const headerDisplayName = document.getElementById('header-display-name');
const profileAvatar = document.getElementById('profile-avatar');
const profileDisplayName = document.getElementById('profile-display-name');
const profileBio = document.getElementById('profile-bio');
const postsCount = document.getElementById('posts-count');
const followersCount = document.getElementById('followers-count');
const followingCount = document.getElementById('following-count');
const userPostsGrid = document.getElementById('user-posts-grid'); 
const noUserPostsMessage = document.getElementById('no-user-posts-message'); 
const loadingSpinner = userPostsGrid.querySelector('.loading-spinner');

// NOVO: Botão de Seguir (Garanta que este ID existe no seu user-profile.html)
const followButton = document.getElementById('follow-button');

let targetUserId = null; // O ID do usuário cujo perfil estamos visitando
let currentUserId = null; // O ID do usuário logado

// --- Autenticação e Carregamento Inicial ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid; // Define o ID do usuário logado
        const urlParams = new URLSearchParams(window.location.search);
        targetUserId = urlParams.get('userId');

        if (!targetUserId) {
            console.error("ID do usuário não encontrado na URL. Redirecionando para o feed.");
            window.location.href = 'feed.html'; 
            return;
        }

        // Se o usuário logado estiver tentando ver o próprio perfil, redireciona para my-profile.html
        if (targetUserId === currentUserId) {
            console.log("Visitando o próprio perfil. Redirecionando para my-profile.html");
            window.location.href = 'my-profile.html';
            return;
        }

        console.log(`Usuário logado: ${currentUserId}, visualizando perfil de: ${targetUserId}`);
        await loadUserProfile(targetUserId); // Carrega dados do perfil do usuário alvo
        await loadUserPosts(targetUserId); // Carrega posts do usuário alvo
        await checkFollowStatus(currentUserId, targetUserId); // NOVO: Verifica e configura o botão de seguir
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/'; 
    }
});

// --- Carregar Dados do Perfil do Usuário Alvo ---
async function loadUserProfile(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            headerDisplayName.textContent = userData.displayName || 'Perfil'; 
            profileDisplayName.textContent = userData.displayName || 'Nome de Usuário';
            profileBio.textContent = userData.bio || 'Sem biografia ainda.';
            profileAvatar.src = userData.photoURL || 'default-avatar.png.jpg'; 

            // NOVO: Preencher contadores de seguidores e seguindo
            followersCount.textContent = userData.followersCount || 0;
            followingCount.textContent = userData.followingCount || 0;

        } else {
            console.warn("Documento do usuário não encontrado para ID:", userId);
            headerDisplayName.textContent = 'Usuário Não Encontrado';
            profileDisplayName.textContent = 'Usuário Não Encontrado';
            profileBio.textContent = 'Este perfil não existe ou foi removido.';
            profileAvatar.src = 'default-avatar.png.jpg'; 
            userPostsGrid.innerHTML = ''; 
            noUserPostsMessage.classList.remove('hidden');
            noUserPostsMessage.textContent = 'Não há publicações para este usuário.';
            loadingSpinner.classList.add('hidden');
            if (followButton) { // Certifica-se que o botão existe antes de manipular
                followButton.classList.add('hidden'); // Oculta o botão se o perfil não existe
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        headerDisplayName.textContent = 'Erro';
        profileDisplayName.textContent = 'Erro ao Carregar';
        profileBio.textContent = 'Não foi possível carregar as informações do perfil.';
    }
}

// --- Carregar Posts do Usuário Alvo ---
async function loadUserPosts(userId) {
    userPostsGrid.innerHTML = ''; 
    noUserPostsMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        const postsQuery = query(
            collection(db, "posts"),
            where("userId", "==", userId), 
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(postsQuery);

        loadingSpinner.classList.add('hidden');

        if (querySnapshot.empty) {
            noUserPostsMessage.classList.remove('hidden');
            postsCount.textContent = 0;
            return;
        }

        postsCount.textContent = querySnapshot.docs.length; 

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postThumbnail = createPostThumbnail(post);
            userPostsGrid.appendChild(postThumbnail);
        });

    } catch (error) {
        console.error("Erro ao carregar posts do usuário:", error);
        noUserPostsMessage.classList.remove('hidden');
        noUserPostsMessage.textContent = 'Erro ao carregar as publicações.';
        loadingSpinner.classList.add('hidden');
    }
}

// --- Reutiliza a função de criar miniatura do post ---
function createPostThumbnail(post) {
    const postThumbnailDiv = document.createElement('div');
    postThumbnailDiv.classList.add('post-thumbnail');

    if (post.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = post.mediaUrl;
        video.controls = false;
        video.autoplay = false;
        video.muted = true;
        video.loop = true;
        postThumbnailDiv.appendChild(video);
        postThumbnailDiv.innerHTML += '<img src="icons/play-button.svg" alt="Vídeo" class="video-play-icon">';
    } else {
        const img = document.createElement('img');
        img.src = post.mediaUrl;
        img.alt = 'Miniatura do Post';
        postThumbnailDiv.appendChild(img);
    }

    postThumbnailDiv.addEventListener('click', () => {
        console.log("Clicou no post:", post);
        // Em um aplicativo real, você redirecionaria para a página de detalhes do post
        // window.location.href = `post-detail.html?postId=${doc.id}`;
    });

    return postThumbnailDiv;
}

// --- Lógica de Seguir/Deixar de Seguir ---

// Verifica o status de seguir e atualiza o botão
async function checkFollowStatus(loggedInUserId, profileUserId) {
    if (!followButton) return; // Garante que o botão existe
    if (!loggedInUserId || !profileUserId) {
        followButton.classList.add('hidden');
        return;
    }

    // Verifica se o usuário logado já segue este perfil
    const followingDocRef = doc(db, "users", loggedInUserId, "following", profileUserId);
    const followingDocSnap = await getDoc(followingDocRef);

    if (followingDocSnap.exists()) {
        followButton.textContent = 'Deixar de Seguir';
        followButton.classList.remove('hidden');
        followButton.classList.remove('follow-button-unfollow'); 
        followButton.classList.add('follow-button-following'); 
    } else {
        followButton.textContent = 'Seguir';
        followButton.classList.remove('hidden');
        followButton.classList.remove('follow-button-following'); 
        followButton.classList.add('follow-button-unfollow'); 
    }
    // Remove qualquer listener anterior para evitar duplicidade antes de adicionar o novo
    followButton.removeEventListener('click', handleFollowButtonClick); 
    followButton.addEventListener('click', handleFollowButtonClick); 
}

// Lida com o clique no botão de seguir/deixar de seguir
async function handleFollowButtonClick() {
    if (!followButton) return; // Garante que o botão existe
    followButton.disabled = true; // Desabilita o botão para evitar cliques múltiplos
    const isFollowing = followButton.textContent === 'Deixar de Seguir';

    try {
        if (isFollowing) {
            await unfollowUser(currentUserId, targetUserId);
            followButton.textContent = 'Seguir';
            followButton.classList.remove('follow-button-following');
            followButton.classList.add('follow-button-unfollow');
        } else {
            await followUser(currentUserId, targetUserId);
            followButton.textContent = 'Deixar de Seguir';
            followButton.classList.remove('follow-button-unfollow');
            followButton.classList.add('follow-button-following');
        }
        // Atualiza os contadores no Firestore e na UI
        await updateFollowCounts(targetUserId, isFollowing ? -1 : 1); 
    } catch (error) {
        console.error("Erro ao alternar status de seguir:", error);
        alert("Ocorreu um erro. Tente novamente.");
        // Reverte o texto do botão em caso de erro
        followButton.textContent = isFollowing ? 'Deixar de Seguir' : 'Seguir';
    } finally {
        followButton.disabled = false; // Reabilita o botão
    }
}

// Função para seguir um usuário
async function followUser(followerId, followedId) {
    // Adiciona o documento na subcoleção 'following' do usuário logado
    await setDoc(doc(db, "users", followerId, "following", followedId), {
        timestamp: serverTimestamp()
    });
    console.log(`${followerId} AGORA SEGUINDO ${followedId}`);

    // Adiciona o documento na subcoleção 'followers' do usuário que está sendo seguido
    await setDoc(doc(db, "users", followedId, "followers", followerId), {
        timestamp: serverTimestamp()
    });
    console.log(`${followedId} AGORA TEM ${followerId} COMO SEGUIDOR`);
}

// Função para deixar de seguir um usuário
async function unfollowUser(followerId, followedId) {
    // Remove o documento da subcoleção 'following' do usuário logado
    await deleteDoc(doc(db, "users", followerId, "following", followedId));
    console.log(`${followerId} DEIXOU DE SEGUIR ${followedId}`);

    // Remove o documento da subcoleção 'followers' do usuário que estava sendo seguido
    await deleteDoc(doc(db, "users", followedId, "followers", followerId));
    console.log(`${followedId} PERDEU ${followerId} COMO SEGUIDOR`);
}

// Atualiza os contadores de seguidores/seguindo no Firestore
async function updateFollowCounts(profileUserId, change) {
    const profileUserRef = doc(db, "users", profileUserId);
    const currentUserRef = doc(db, "users", currentUserId);

    try {
        // Atualiza o contador de seguidores do perfil que está sendo visitado
        await updateDoc(profileUserRef, {
            followersCount: increment(change)
        });

        // Atualiza o contador de 'seguindo' do usuário logado
        await updateDoc(currentUserRef, {
            followingCount: increment(change)
        });

        // Atualiza a UI para refletir os novos contadores no perfil visitado
        const profileUserSnap = await getDoc(profileUserRef);
        if (profileUserSnap.exists()) {
            followersCount.textContent = profileUserSnap.data().followersCount || 0;
        }

        // Não precisa atualizar o followingCount no user-profile.js porque ele é o followingCount do usuário logado
        // que estaria no my-profile.html. O `checkFollowStatus` já lida com o texto do botão.

    } catch (error) {
        console.error("Erro ao atualizar contadores de seguidores:", error);
    }
}

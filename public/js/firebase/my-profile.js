// public/js/my-profile.js

import { getFirestore, doc, getDoc, query, collection, where, orderBy, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js"; // Não precisamos mais do Firebase Storage para avatares
import { app } from './firebase-init.js';

// --- Cloudinary Config (se você for usar o Cloudinary para avatar também) ---
// SE VOCÊ FOR USAR CLOUDINARY PARA AVATAR TAMBÉM:
// Pegue seu Cloud Name e crie um preset de upload não assinado para avatares (ex: 'zafyre_avatars_unsigned')
const CLOUDINARY_CLOUD_NAME_AVATAR = 'dblahe34z'; // SUBSTITUA PELO SEU CLOUD NAME
const CLOUDINARY_UPLOAD_PRESET_AVATAR = 'zafyre_avatars_unsigned'; // Crie este preset no Cloudinary

const db = getFirestore(app);
const auth = getAuth(app);
// const storage = getStorage(app); // Descomente se for usar Firebase Storage para avatares

// Elementos da UI do Perfil
const profileAvatar = document.getElementById('profile-avatar');
const profileDisplayName = document.getElementById('profile-display-name');
const profileBio = document.getElementById('profile-bio');
const postsCount = document.getElementById('posts-count');
const followersCount = document.getElementById('followers-count');
const followingCount = document.getElementById('following-count');
const myPostsGrid = document.getElementById('my-posts-grid');
const noMyPostsMessage = document.getElementById('no-my-posts-message');
const loadingSpinner = myPostsGrid.querySelector('.loading-spinner');
const editProfileButton = document.getElementById('edit-profile-button');

// Elementos do Modal de Edição de Perfil
const editProfileModal = document.getElementById('edit-profile-modal');
const closeEditModalButton = editProfileModal.querySelector('.close-button');
const editProfileForm = document.getElementById('edit-profile-form');
const editDisplayNameInput = document.getElementById('edit-display-name');
const editBioInput = document.getElementById('edit-bio');
const editAvatarUploadInput = document.getElementById('edit-avatar-upload');
const editAvatarPreview = document.getElementById('edit-avatar-preview');

let currentUserId = null;
let currentUserData = null; // Para armazenar os dados do perfil do usuário logado

// --- Autenticação e Carregamento Inicial ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado na tela de Perfil:", currentUserId);
        await loadUserProfile(currentUserId);
        await loadUserPosts(currentUserId);
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/'; // Redireciona para a página de login
    }
});

// --- Carregar Dados do Perfil do Usuário ---
async function loadUserProfile(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUserData = userDocSnap.data();
            profileDisplayName.textContent = currentUserData.displayName || 'Nome de Usuário';
            profileBio.textContent = currentUserData.bio || 'Sem biografia ainda.';
            profileAvatar.src = currentUserData.photoURL || 'default-avatar.png.jpg'; // Usar o avatar padrão
            editAvatarPreview.src = currentUserData.photoURL || 'default-avatar.png.jpg'; // Prévia no modal

            // Preencher o modal de edição
            editDisplayNameInput.value = currentUserData.displayName || '';
            editBioInput.value = currentUserData.bio || '';

            // Futuramente, você preencheria followersCount e followingCount aqui
            // followersCount.textContent = currentUserData.followersCount || 0;
            // followingCount.textContent = currentUserData.followingCount || 0;

        } else {
            console.warn("Documento do usuário não encontrado no Firestore. Criando um padrão...");
            // Se o documento do usuário não existir, crie um básico
            await updateDoc(userDocRef, { // Usar updateDoc aqui vai criar se não existir (set com merge: true)
                displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                email: auth.currentUser.email,
                photoURL: auth.currentUser.photoURL || 'default-avatar.png.jpg',
                bio: '',
                createdAt: serverTimestamp()
            }, { merge: true }); // Usar merge: true para não sobrescrever outros campos se já existir
            loadUserProfile(userId); // Tenta carregar novamente após criar
        }
    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        profileDisplayName.textContent = 'Erro ao carregar';
        profileBio.textContent = 'Não foi possível carregar as informações do perfil.';
    }
}

// --- Carregar Posts do Usuário ---
async function loadUserPosts(userId) {
    myPostsGrid.innerHTML = ''; // Limpa posts anteriores
    noMyPostsMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        const postsQuery = query(
            collection(db, "posts"),
            where("userId", "==", userId), // Filtra posts pelo ID do usuário
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(postsQuery);

        loadingSpinner.classList.add('hidden');

        if (querySnapshot.empty) {
            noMyPostsMessage.classList.remove('hidden');
            postsCount.textContent = 0;
            return;
        }

        postsCount.textContent = querySnapshot.docs.length; // Atualiza contador de posts

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postThumbnail = createPostThumbnail(post);
            myPostsGrid.appendChild(postThumbnail);
        });

    } catch (error) {
        console.error("Erro ao carregar posts do usuário:", error);
        noMyPostsMessage.classList.remove('hidden');
        noMyPostsMessage.textContent = 'Erro ao carregar suas publicações.';
        loadingSpinner.classList.add('hidden');
    }
}

// --- Criar Miniatura do Post (para grid do perfil) ---
function createPostThumbnail(post) {
    const postThumbnailDiv = document.createElement('div');
    postThumbnailDiv.classList.add('post-thumbnail');

    if (post.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = post.mediaUrl;
        video.controls = false; // Não queremos controles no thumbnail
        video.autoplay = false;
        video.muted = true; // Essencial para autoplay sem interação
        video.loop = true;
        postThumbnailDiv.appendChild(video);
        // Opcional: Adicionar um ícone de play sobreposto
        postThumbnailDiv.innerHTML += '<img src="icons/play-button.svg" alt="Vídeo" class="video-play-icon">'; // Você precisaria criar este ícone
    } else {
        const img = document.createElement('img');
        img.src = post.mediaUrl;
        img.alt = 'Miniatura do Post';
        postThumbnailDiv.appendChild(img);
    }

    // Adicionar um listener para clicar e talvez abrir um modal de visualização do post completo
    postThumbnailDiv.addEventListener('click', () => {
        console.log("Clicou no post:", post);
        // Implementar abertura de modal ou redirecionamento para página de detalhes do post
    });

    return postThumbnailDiv;
}

// --- Lógica do Modal de Edição de Perfil ---
editProfileButton.addEventListener('click', () => {
    // Preenche o modal com os dados atuais antes de abrir
    editDisplayNameInput.value = currentUserData.displayName || '';
    editBioInput.value = currentUserData.bio || '';
    editAvatarPreview.src = currentUserData.photoURL || 'default-avatar.png.jpg';
    editProfileModal.classList.add('visible');
});

closeEditModalButton.addEventListener('click', () => {
    editProfileModal.classList.remove('visible');
});

// Fechar modal clicando fora
window.addEventListener('click', (event) => {
    if (event.target == editProfileModal) {
        editProfileModal.classList.remove('visible');
    }
});

// Prévia do novo avatar selecionado
editAvatarUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        editAvatarPreview.src = URL.createObjectURL(file);
    }
});

// Envio do formulário de edição de perfil
editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newDisplayName = editDisplayNameInput.value.trim();
    const newBio = editBioInput.value.trim();
    const avatarFile = editAvatarUploadInput.files[0];

    if (!newDisplayName && !avatarFile) {
        alert("Pelo menos o nome de exibição ou uma nova foto de perfil é necessário.");
        return;
    }

    let newPhotoURL = currentUserData.photoURL; // Começa com o URL atual

    try {
        // 1. Fazer upload do novo avatar para o Cloudinary (se um novo arquivo foi selecionado)
        if (avatarFile) {
            console.log("Fazendo upload do novo avatar...");
            const formData = new FormData();
            formData.append('file', avatarFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET_AVATAR); // Use o preset de avatar
            formData.append('folder', `zafyre_avatars/${currentUserId}`); // Pasta específica para avatares

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME_AVATAR}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Cloudinary avatar upload failed: ${errorData.error.message}`);
            }

            const data = await response.json();
            newPhotoURL = data.secure_url;
            console.log('Novo avatar no Cloudinary:', newPhotoURL);
        }

        // 2. Atualizar o perfil no Firebase Authentication
        await updateProfile(auth.currentUser, {
            displayName: newDisplayName,
            photoURL: newPhotoURL
        });
        console.log("Perfil do Firebase Auth atualizado.");

        // 3. Atualizar o documento do usuário no Firestore
        const userDocRef = doc(db, "users", currentUserId);
        await updateDoc(userDocRef, {
            displayName: newDisplayName,
            bio: newBio,
            photoURL: newPhotoURL
        });
        console.log("Documento do usuário no Firestore atualizado.");

        alert("Perfil atualizado com sucesso!");
        editProfileModal.classList.remove('visible');
        // Recarregar os dados do perfil na UI
        await loadUserProfile(currentUserId);
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        alert(`Erro ao atualizar perfil: ${error.message}`);
    }
});

// --- Lógica de Logout ---
// Você pode adicionar um botão de logout em my-profile.html (ex: no footer ou em uma seção de configurações)
// Exemplo de botão no HTML: <button id="logout-button">Sair</button>
// const logoutButton = document.getElementById('logout-button');
// if (logoutButton) {
//     logoutButton.addEventListener('click', async () => {
//         try {
//             await signOut(auth);
//             console.log("Usuário deslogado.");
//             window.location.href = '/'; // Redireciona para a página de login
//         } catch (error) {
//             console.error("Erro ao fazer logout:", error);
//             alert("Erro ao fazer logout. Tente novamente.");
//         }
//     });
// }

let currentUser = null;

// Função para lidar com assinatura
async function handleSubscription() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserId = urlParams.get('userId');

    if (!currentUser || !profileUserId) return;

    try {
        const subscribeBtn = document.getElementById('subscribe-btn');
        subscribeBtn.disabled = true;
        subscribeBtn.textContent = 'Processando...';

        // Aqui você implementaria a lógica de assinatura
        // Por enquanto, vamos apenas simular
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const following = userData?.following || [];

        if (following.includes(profileUserId)) {
            // Já está seguindo - remover
            const updatedFollowing = following.filter(id => id !== profileUserId);
            await updateDoc(userRef, { following: updatedFollowing });

            subscribeBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Assinar Perfil
            `;
        } else {
            // Adicionar seguimento
            following.push(profileUserId);
            await updateDoc(userRef, { following: following });

            subscribeBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Seguindo
            `;
        }

    } catch (error) {
        console.error('Erro ao processar assinatura:', error);
        alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
        const subscribeBtn = document.getElementById('subscribe-btn');
        subscribeBtn.disabled = false;
    }
}

// Função para carregar posts do usuário
async function loadUserPosts(userId) {
    const postsGrid = document.getElementById('posts-grid');

    if (!postsGrid) return;

    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        postsGrid.innerHTML = '';

        if (querySnapshot.empty) {
            postsGrid.innerHTML = '<div class="info-message">Nenhum post encontrado</div>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = createPostThumbnail(post, doc.id);
            postsGrid.appendChild(postElement);
        });

    } catch (error) {
        console.error('Erro ao carregar posts do usuário:', error);
        postsGrid.innerHTML = '<div class="info-message">Erro ao carregar posts</div>';
    }
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Usuário autenticado na tela de Perfil:', user.uid);
            currentUser = user;

            // Verificar se é perfil próprio ou de outro usuário
            const urlParams = new URLSearchParams(window.location.search);
            const profileUserId = urlParams.get('userId');

            if (profileUserId && profileUserId !== user.uid) {
                // Perfil de outro usuário
                loadUserProfile(profileUserId);
                loadUserPosts(profileUserId);

                // Mostrar botões de chat e assinatura
                document.getElementById('edit-profile-btn').classList.add('hidden');
                document.getElementById('start-chat-btn').classList.remove('hidden');
                document.getElementById('subscribe-btn').classList.remove('hidden');

                // Atualizar título da página
                document.querySelector('.header h1').textContent = 'Perfil';

            } else {
                // Perfil próprio
                loadUserProfile(user.uid);
                loadUserPosts(user.uid);

                // Mostrar apenas botão de editar
                document.getElementById('edit-profile-btn').classList.remove('hidden');
                document.getElementById('start-chat-btn').classList.add('hidden');
                document.getElementById('subscribe-btn').classList.add('hidden');

                // Atualizar título da página
                document.querySelector('.header h1').textContent = 'Meu Perfil';
            }
        } else {
            console.log('Usuário não autenticado, redirecionando...');
            window.location.href = 'login.html';
        }
    });

    // Event listener para editar perfil
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfileModal);
    }

    // Event listener para iniciar chat
    const startChatBtn = document.getElementById('start-chat-btn');
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            if (userId) {
                window.location.href = `chat.html?userId=${userId}`;
            }
        });
    }

    // Event listener para assinar perfil
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', handleSubscription);
    }
});

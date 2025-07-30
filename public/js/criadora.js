// public/js/criadora.js

import { db, auth } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openPostModal } from './common.js'; // Reutiliza o modal de posts

document.addEventListener('DOMContentLoaded', async () => {
    const creatorAvatar = document.getElementById('creator-avatar');
    const creatorName = document.getElementById('creator-name');
    const creatorBio = document.getElementById('creator-bio');
    const followButton = document.getElementById('follow-button');
    const messageButton = document.getElementById('message-button');
    const createPostLink = document.getElementById('create-post-link');
    const creatorPostsContainer = document.getElementById('creator-posts');
    const profileNavBtns = document.querySelectorAll('.profile-nav-btn');

    let currentCreatorId = null; // ID do criador cujo perfil está sendo visualizado
    let currentUser = null;     // Usuário logado

    // 1. Obter o ID do criador da URL
    const urlParams = new URLSearchParams(window.location.search);
    const creatorIdFromUrl = urlParams.get('id');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log("Usuário logado:", currentUser.uid);

            if (creatorIdFromUrl) {
                currentCreatorId = creatorIdFromUrl;
            } else {
                // Se não há ID na URL, o usuário está vendo o próprio perfil
                currentCreatorId = currentUser.uid;
            }
            
            await loadCreatorProfile(currentCreatorId);
            await loadCreatorPosts(currentCreatorId, 'all'); // Carrega todas as posts por padrão
            updateUIForCurrentUser(currentCreatorId); // Ajusta botões com base no usuário logado
        } else {
            // Ninguém logado, talvez redirecionar ou mostrar uma versão limitada
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = 'index.html'; 
        }
    });

    /**
     * Carrega as informações do perfil do criador.
     * @param {string} creatorUid - UID do criador.
     */
    async function loadCreatorProfile(creatorUid) {
        try {
            const creatorDocRef = doc(db, "users", creatorUid);
            const creatorDocSnap = await getDoc(creatorDocRef);

            if (creatorDocSnap.exists()) {
                const data = creatorDocSnap.data();
                creatorAvatar.src = data.profilePicture || 'assets/default-avatar.png';
                creatorName.textContent = data.name;
                creatorBio.textContent = data.bio || 'Sem biografia ainda.';

                // Atualizar o estado do botão "Seguir"
                if (currentUser && data.followers && data.followers.includes(currentUser.uid)) {
                    followButton.textContent = 'Seguindo';
                    followButton.classList.remove('btn-primary');
                    followButton.classList.add('btn-secondary');
                } else {
                    followButton.textContent = 'Seguir';
                    followButton.classList.remove('btn-secondary');
                    followButton.classList.add('btn-primary');
                }
            } else {
                console.error("Dados do criador não encontrados.");
                creatorName.textContent = 'Criador Não Encontrado';
                creatorBio.textContent = 'Este perfil pode não existir.';
            }
        } catch (error) {
            console.error("Erro ao carregar perfil do criador:", error);
            creatorName.textContent = 'Erro ao Carregar Perfil';
            creatorBio.textContent = 'Ocorreu um erro.';
        }
    }

    /**
     * Carrega as postagens de um criador específico.
     * @param {string} creatorUid - UID do criador.
     * @param {string} filterType - 'all', 'ppv', 'free'.
     */
    async function loadCreatorPosts(creatorUid, filterType = 'all') {
        creatorPostsContainer.innerHTML = '<p class="no-posts-message">Carregando postagens...</p>';

        try {
            const postsColRef = collection(db, "posts");
            let q = query(postsColRef, 
                          where("creatorId", "==", creatorUid), 
                          orderBy("createdAt", "desc"));

            if (filterType === 'ppv') {
                q = query(q, where("price", ">", 0));
            } else if (filterType === 'free') {
                q = query(q, where("price", "==", 0));
            }

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                creatorPostsContainer.innerHTML = '<p class="no-posts-message">Nenhuma postagem encontrada para este criador.</p>';
                return;
            }

            creatorPostsContainer.innerHTML = ''; // Limpa a mensagem de carregamento

            const posts = querySnapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));
            
            // Agora, vamos verificar se o usuário logado já comprou os posts PPV
            const postsWithPurchaseStatus = await Promise.all(posts.map(async (post) => {
                if (post.price > 0 && currentUser && currentUser.uid !== creatorUid) {
                    const postDocRef = doc(db, "posts", post.id);
                    const postDocSnap = await getDoc(postDocRef);
                    post.isPurchased = postDocSnap.exists() && postDocSnap.data().purchases && postDocSnap.data().purchases.includes(currentUser.uid);
                } else {
                    post.isPurchased = true; // Se não for PPV ou for o próprio criador, considera "comprado"
                }
                return post;
            }));


            postsWithPurchaseStatus.forEach(post => {
                displayPost(post, creatorUid === currentUser.uid); // Passa se é o próprio criador
            });

        } catch (error) {
            console.error("Erro ao carregar postagens do criador:", error);
            creatorPostsContainer.innerHTML = '<p class="error-message">Erro ao carregar postagens.</p>';
        }
    }

    /**
     * Exibe uma postagem no feed/perfil.
     * Reutiliza a lógica do feed, mas com alguns ajustes para o perfil.
     * @param {Object} post - Objeto da postagem.
     * @param {boolean} isOwnProfile - True se o usuário logado for o dono do perfil.
     */
    function displayPost(post, isOwnProfile) {
        const postElement = document.createElement('div');
        postElement.classList.add('post-card'); // Reutiliza a classe de estilo do feed
        postElement.dataset.postId = post.id;

        const isPPV = post.price > 0;
        const displayAsPurchased = post.isPurchased; // Usar o status de compra verificado
        
        let mediaHtml = post.type === 'video' 
            ? `<video src="${post.mediaUrl}" controls loading="lazy" class="post-media"></video>`
            : `<img src="${post.mediaUrl}" alt="${post.text}" loading="lazy" class="post-media">`;
        
        let ppvOverlay = '';
        if (isPPV && !displayAsPurchased) {
             mediaHtml = `<div class="ppv-blur-overlay">
                            ${mediaHtml}
                            <div class="ppv-lock-icon"><i class="fas fa-lock"></i></div>
                            <div class="ppv-price-tag">Conteúdo Premium<br>Apenas $${post.price.toFixed(2)}</div>
                        </div>`;
            ppvOverlay = `<button class="btn btn-primary btn-buy-ppv" data-post-id="${post.id}" data-post-price="${post.price}" data-creator-id="${post.creatorId}">
                            <i class="fas fa-shopping-cart"></i> Comprar por $${post.price.toFixed(2)}
                          </button>`;
        }

        const hasLiked = post.likes && currentUser ? post.likes.includes(currentUser.uid) : false;
        const likeIconClass = hasLiked ? 'fas' : 'far';

        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.creatorProfilePicture || 'assets/default-avatar.png'}" alt="${post.creatorName}" class="post-avatar">
                <div class="post-info">
                    <span class="creator-name">${post.creatorName || creatorName.textContent}</span>
                    <span class="post-date">${formatDate(post.createdAt.toDate())}</span>
                </div>
            </div>
            <div class="post-media-container">
                ${mediaHtml}
            </div>
            <div class="post-content">
                <p class="post-text">${post.text}</p>
            </div>
            <div class="post-actions">
                <button class="like-btn" data-post-id="${post.id}">
                    <i class="${likeIconClass} fa-heart"></i> <span class="like-count">${post.likes ? post.likes.length : 0}</span>
                </button>
                <button class="comment-btn" data-post-id="${post.id}">
                    <i class="far fa-comment"></i> <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
                </button>
                ${ppvOverlay}
                ${isOwnProfile ? `<button class="btn btn-danger btn-delete-post" data-post-id="${post.id}"><i class="fas fa-trash-alt"></i> Excluir</button>` : ''}
            </div>
        `;

        // Event listener para abrir o modal de postagem
        postElement.querySelector('.post-media-container').addEventListener('click', () => {
            if (isPPV && !displayAsPurchased) {
                alert('Este é um conteúdo premium! Compre para desbloquear.');
                return;
            }
            openPostModal(
                post.mediaUrl, 
                post.type === 'video', 
                post.text, 
                post.likes ? post.likes.length : 0, 
                post.comments ? post.comments.length : 0,
                isPPV && !displayAsPurchased, // showBuyBtn
                false, // showFollowBtn (já na tela de perfil)
                isOwnProfile // showDeleteBtn
            );
        });

        // Event listener para curtir/descurtir
        postElement.querySelector('.like-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!currentUser) {
                alert('Você precisa estar logado para curtir!');
                return;
            }
            const postId = e.currentTarget.dataset.postId;
            const likeIcon = e.currentTarget.querySelector('i');
            const likeCountSpan = e.currentTarget.querySelector('.like-count');
            
            try {
                const postRef = doc(db, "posts", postId);
                const postSnap = await getDoc(postRef);
                const currentLikes = postSnap.exists() ? (postSnap.data().likes || []) : [];
                const hasAlreadyLiked = currentLikes.includes(currentUser.uid);

                if (hasAlreadyLiked) {
                    await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
                    likeIcon.classList.remove('fas');
                    likeIcon.classList.add('far');
                    likeCountSpan.textContent = parseInt(likeCountSpan.textContent) - 1;
                } else {
                    await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
                    likeIcon.classList.remove('far');
                    likeIcon.classList.add('fas');
                    likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
                }
            } catch (error) {
                console.error("Erro ao curtir/descurtir:", error);
                alert('Erro ao interagir com a postagem. Tente novamente.');
            }
        });

        // Event listener para botão de compra (PPV)
        const buyPpvBtn = postElement.querySelector('.btn-buy-ppv');
        if (buyPpvBtn) {
            buyPpvBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!currentUser) {
                    alert('Você precisa estar logado para comprar conteúdo!');
                    return;
                }
                const postId = e.currentTarget.dataset.postId;
                const price = parseFloat(e.currentTarget.dataset.postPrice);
                const creatorId = e.currentTarget.dataset.creatorId;

                alert(`Simulando compra do conteúdo por $${price.toFixed(2)}!`);

                try {
                    const { increment } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                    const postRef = doc(db, "posts", postId);
                    const creatorRef = doc(db, "users", creatorId);
                    const userRef = doc(db, "users", currentUser.uid);

                    // Adiciona o UID do usuário à lista de compras do post
                    await updateDoc(postRef, { purchases: arrayUnion(currentUser.uid) });

                    // Atualiza o saldo do criador e do usuário
                    await updateDoc(creatorRef, { zafyreCoins: increment(price * 0.8) }); // Criador ganha 80%
                    await updateDoc(userRef, { zafyreCoins: increment(-price) });        // Usuário gasta

                    alert('Conteúdo comprado com sucesso! A página será recarregada.');
                    window.location.reload(); 

                } catch (purchaseError) {
                    console.error("Erro ao simular compra:", purchaseError);
                    alert('Erro ao tentar comprar o conteúdo. Verifique seu saldo ou tente novamente.');
                }
            });
        }

        // Event listener para botão de excluir postagem (apenas para o próprio criador)
        const deletePostBtn = postElement.querySelector('.btn-delete-post');
        if (deletePostBtn) {
            deletePostBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postIdToDelete = e.currentTarget.dataset.postId;
                if (confirm('Tem certeza que deseja excluir esta postagem? Esta ação é irreversível.')) {
                    try {
                        // Importar deleteDoc
                        const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                        await deleteDoc(doc(db, "posts", postIdToDelete));
                        alert('Postagem excluída com sucesso!');
                        // Remove a postagem do DOM
                        postElement.remove(); 
                    } catch (error) {
                        console.error("Erro ao excluir postagem:", error);
                        alert('Não foi possível excluir a postagem.');
                    }
                }
            });
        }

        creatorPostsContainer.appendChild(postElement);
    }

    // Lógica para seguir/deixar de seguir
    followButton.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Você precisa estar logado para seguir um criador!');
            return;
        }
        if (currentUser.uid === currentCreatorId) {
            alert('Você não pode seguir a si mesmo!');
            return;
        }

        try {
            const creatorRef = doc(db, "users", currentCreatorId);
            const creatorSnap = await getDoc(creatorRef);
            const creatorData = creatorSnap.data();
            
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            if (!creatorData || !userData) {
                alert('Erro: Dados do criador ou do usuário não encontrados.');
                return;
            }

            const isFollowing = creatorData.followers && creatorData.followers.includes(currentUser.uid);

            if (isFollowing) {
                // Deixar de seguir
                await updateDoc(creatorRef, { followers: arrayRemove(currentUser.uid) });
                await updateDoc(userRef, { following: arrayRemove(currentCreatorId) });
                followButton.textContent = 'Seguir';
                followButton.classList.remove('btn-secondary');
                followButton.classList.add('btn-primary');
                alert('Você deixou de seguir este criador.');
            } else {
                // Seguir
                await updateDoc(creatorRef, { followers: arrayUnion(currentUser.uid) });
                await updateDoc(userRef, { following: arrayUnion(currentCreatorId) });
                followButton.textContent = 'Seguindo';
                followButton.classList.remove('btn-primary');
                followButton.classList.add('btn-secondary');
                alert('Você agora está seguindo este criador!');
            }
        } catch (error) {
            console.error("Erro ao seguir/deixar de seguir:", error);
            alert('Erro ao processar a solicitação. Tente novamente.');
        }
    });

    // Lógica para botão de mensagem (abre o chat)
    messageButton.addEventListener('click', () => {
        if (!currentUser) {
            alert('Você precisa estar logado para enviar mensagens!');
            return;
        }
        if (currentUser.uid === currentCreatorId) {
            alert('Você não pode enviar mensagem para si mesmo por aqui. Vá para o chat!');
            return;
        }
        // Redireciona para a página de chat, talvez com o ID do criador para iniciar a conversa
        window.location.href = `chat.html?userId=${currentCreatorId}`;
    });


    /**
     * Ajusta a UI com base no usuário logado e no perfil sendo visualizado.
     * @param {string} profileUid - UID do perfil que está sendo exibido.
     */
    async function updateUIForCurrentUser(profileUid) {
        if (!currentUser) return; // Se não houver usuário logado, não faz nada

        if (profileUid === currentUser.uid) {
            // Se o usuário logado está vendo o próprio perfil (criador)
            createPostLink.style.display = 'inline-flex'; // Mostra o botão de criar post
            followButton.style.display = 'none'; // Esconde o botão de seguir
            messageButton.style.display = 'none'; // Esconde o botão de mensagem
        } else {
            // Se está vendo o perfil de outro criador
            createPostLink.style.display = 'none'; // Esconde o botão de criar post
            followButton.style.display = 'inline-flex'; // Mostra o botão de seguir
            messageButton.style.display = 'inline-flex'; // Mostra o botão de mensagem
        }

        // Se o usuário logado NÃO é um criador, esconder o botão de criar postagem de qualquer forma
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().accountType !== 'creator') {
            createPostLink.style.display = 'none';
        }
    }

    // Lógica para os botões de filtro (Todas, PPV, Gratuito)
    profileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            profileNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterType = btn.dataset.filter;
            if (currentCreatorId) {
                loadCreatorPosts(currentCreatorId, filterType);
            }
        });
    });

    /**
     * Formata a data para exibição amigável.
     * @param {Date} date - Objeto Date.
     * @returns {string} Data formatada.
     */
    function formatDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 0) {
            return 'Hoje';
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }

    // Importa o increment do Firestore para operações atômicas (incrementar/decrementar valores)
    const { increment } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
});

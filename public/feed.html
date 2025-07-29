// public/js/feed.js

import { db, auth } from './firebase-config.js'; // Importa o Firestore e Auth
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openPostModal } from './common.js'; // Importa a função para abrir o modal de postagem

document.addEventListener('DOMContentLoaded', async () => {
    const feedPostsContainer = document.getElementById('feed-posts');
    let currentUser = null; // Variável para armazenar o usuário logado

    // Ouve mudanças no estado de autenticação para saber quem está logado
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log("Usuário logado no feed:", currentUser.uid);
            loadFeedPosts(); // Carrega as postagens após o usuário estar logado
        } else {
            currentUser = null;
            console.log("Nenhum usuário logado. Redirecionando para login.");
            // Redireciona para o login se não houver usuário logado (opcional, pode deixar o common.js fazer isso)
            window.location.href = 'index.html';
        }
    });

    /**
     * Carrega as postagens do Firestore e as exibe no feed.
     */
    async function loadFeedPosts() {
        if (!feedPostsContainer) {
            console.error("Elemento #feed-posts não encontrado.");
            return;
        }

        feedPostsContainer.innerHTML = '<h2>Carregando postagens...</h2>'; // Mensagem de carregamento

        try {
            // Consulta as postagens, ordenando pela data de criação (mais recentes primeiro)
            // e limitando a um número (ex: 10 postagens por vez)
            const postsColRef = collection(db, "posts");
            const q = query(postsColRef, orderBy("createdAt", "desc"), limit(10)); // Exemplo de 10 posts
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                feedPostsContainer.innerHTML = '<p class="no-posts-message">Nenhuma postagem encontrada ainda. Seja o primeiro a criar!</p>';
                return;
            }

            feedPostsContainer.innerHTML = ''; // Limpa a mensagem de carregamento

            // Para cada postagem, busca os dados do criador
            const postPromises = querySnapshot.docs.map(async (docSnapshot) => {
                const post = { id: docSnapshot.id, ...docSnapshot.data() };
                
                // Busca os dados do criador da postagem
                const creatorDocRef = doc(db, "users", post.creatorId);
                const creatorDocSnap = await getDoc(creatorDocRef);
                const creatorData = creatorDocSnap.exists() ? creatorDocSnap.data() : { name: 'Usuário Desconhecido', profilePicture: 'assets/default-avatar.png' };

                post.creatorName = creatorData.name;
                post.creatorProfilePicture = creatorData.profilePicture;
                post.creatorAccountType = creatorData.accountType; // Adiciona o tipo de conta do criador

                return post;
            });

            const posts = await Promise.all(postPromises);
            posts.forEach(post => {
                displayPost(post);
            });

        } catch (error) {
            console.error("Erro ao carregar postagens:", error);
            feedPostsContainer.innerHTML = '<p class="error-message">Erro ao carregar postagens. Tente novamente mais tarde.</p>';
        }
    }

    /**
     * Exibe uma postagem no feed.
     * @param {Object} post - Objeto da postagem com dados completos.
     */
    function displayPost(post) {
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.dataset.postId = post.id; // Armazena o ID da postagem

        // Determina se é imagem ou vídeo
        const mediaHtml = post.type === 'video' 
            ? `<video src="${post.mediaUrl}" controls loading="lazy" class="post-media"></video>`
            : `<img src="${post.mediaUrl}" alt="${post.text}" loading="lazy" class="post-media">`;

        // Verifica se o usuário logado já curtiu esta postagem
        const hasLiked = post.likes && currentUser ? post.likes.includes(currentUser.uid) : false;
        const likeIconClass = hasLiked ? 'fas' : 'far'; // far = regular (sem preenchimento), fas = solid (preenchido)

        // Verifica se é um conteúdo PPV e se o usuário logado já comprou
        const isPPV = post.price > 0;
        const isPurchased = isPPV && currentUser && post.purchases && post.purchases.includes(currentUser.uid); // Assumindo campo 'purchases' no post
        
        let displayMedia = mediaHtml;
        let ppvOverlay = '';

        if (isPPV && !isPurchased && currentUser && currentUser.uid !== post.creatorId) {
            // Se for PPV, não comprado e não é o próprio criador vendo o post
            displayMedia = `<div class="ppv-blur-overlay">
                                ${mediaHtml}
                                <div class="ppv-lock-icon"><i class="fas fa-lock"></i></div>
                                <div class="ppv-price-tag">Conteúdo Premium<br>Apenas $${post.price.toFixed(2)}</div>
                            </div>`;
            ppvOverlay = `<button class="btn btn-primary btn-buy-ppv" data-post-id="${post.id}" data-post-price="${post.price}" data-creator-id="${post.creatorId}">
                            <i class="fas fa-shopping-cart"></i> Comprar por $${post.price.toFixed(2)}
                          </button>`;
        }


        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.creatorProfilePicture || 'assets/default-avatar.png'}" alt="${post.creatorName}" class="post-avatar">
                <div class="post-info">
                    <span class="creator-name">${post.creatorName}</span>
                    <span class="post-date">${formatDate(post.createdAt.toDate())}</span>
                </div>
            </div>
            <div class="post-media-container">
                ${displayMedia}
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
                ${ppvOverlay} </div>
        `;

        // Adiciona listener para o clique no card inteiro para abrir o modal
        postElement.querySelector('.post-media-container').addEventListener('click', () => {
             // Se for PPV e não comprado pelo usuário, não abre o modal (ou abre com blur/mensagem)
            if (isPPV && !isPurchased && currentUser && currentUser.uid !== post.creatorId) {
                alert('Este é um conteúdo premium! Compre para desbloquear.');
                // Alternativamente, você pode abrir o modal de uma forma diferente para PPV não comprado.
                // Por agora, um alerta simples é suficiente.
                return; 
            }
            openPostModal(
                post.mediaUrl, 
                post.type === 'video', 
                post.text, 
                post.likes ? post.likes.length : 0, 
                post.comments ? post.comments.length : 0,
                isPPV && !isPurchased && currentUser && currentUser.uid !== post.creatorId, // Show buy button
                false, // showFollowBtn (será definido em perfil)
                currentUser && currentUser.uid === post.creatorId // showDeleteBtn (se for o próprio criador)
            );
        });

        // Adiciona listener para o botão de curtir
        postElement.querySelector('.like-btn').addEventListener('click', async (e) => {
            e.stopPropagation(); // Impede que o clique no botão de curtir propague para o card (e abra o modal)
            if (!currentUser) {
                alert('Você precisa estar logado para curtir!');
                return;
            }
            const postId = e.currentTarget.dataset.postId;
            const likeIcon = e.currentTarget.querySelector('i');
            const likeCountSpan = e.currentTarget.querySelector('.like-count');
            
            try {
                const postRef = doc(db, "posts", postId);
                if (hasLiked) {
                    // Descurtir
                    await updateDoc(postRef, {
                        likes: arrayRemove(currentUser.uid)
                    });
                    likeIcon.classList.remove('fas');
                    likeIcon.classList.add('far');
                    likeCountSpan.textContent = parseInt(likeCountSpan.textContent) - 1;
                    post.likes = post.likes.filter(id => id !== currentUser.uid); // Atualiza o objeto post localmente
                } else {
                    // Curtir
                    await updateDoc(postRef, {
                        likes: arrayUnion(currentUser.uid)
                    });
                    likeIcon.classList.remove('far');
                    likeIcon.classList.add('fas');
                    likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
                    post.likes = [...(post.likes || []), currentUser.uid]; // Atualiza o objeto post localmente
                }
            } catch (error) {
                console.error("Erro ao curtir/descurtir:", error);
                alert('Erro ao interagir com a postagem. Tente novamente.');
            }
        });

        // Adiciona listener para o botão de comentários (abre o modal de postagem, mas foca nos comentários)
        postElement.querySelector('.comment-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique no botão de comentário propague
            // Por enquanto, apenas abre o modal como se fosse para ver detalhes.
            // No futuro, podemos adicionar uma aba de comentários dentro do modal.
             openPostModal(
                post.mediaUrl, 
                post.type === 'video', 
                post.text, 
                post.likes ? post.likes.length : 0, 
                post.comments ? post.comments.length : 0,
                isPPV && !isPurchased && currentUser && currentUser.uid !== post.creatorId, // Show buy button
                false, // showFollowBtn
                currentUser && currentUser.uid === post.creatorId // showDeleteBtn
            );
            // alert('Funcionalidade de comentários em desenvolvimento!');
        });

        // Adiciona listener para o botão "Comprar Conteúdo" se ele existir
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

                // Lógica de compra aqui (Mercado Pago).
                // Por agora, vamos simular a compra e atualizar o Firestore.
                // Em um projeto real, isso envolveria chamadas a um backend para o Mercado Pago.
                
                alert(`Simulando compra do conteúdo por $${price.toFixed(2)}!`);

                try {
                    // Marca o post como comprado para o usuário
                    const postRef = doc(db, "posts", postId);
                    await updateDoc(postRef, {
                        purchases: arrayUnion(currentUser.uid) // Adiciona o UID do usuário à lista de compras
                    });

                    // Atualiza o saldo do criador (simulação)
                    const creatorRef = doc(db, "users", creatorId);
                    await updateDoc(creatorRef, {
                        zafyreCoins: increment(price * 0.8) // Exemplo: criador recebe 80%
                    });

                    // Atualiza o saldo do usuário (simulação de débito)
                    const userRef = doc(db, "users", currentUser.uid);
                    await updateDoc(userRef, {
                        zafyreCoins: increment(-price)
                    });

                    alert('Conteúdo comprado com sucesso! A página será recarregada.');
                    // Recarrega a página para exibir o conteúdo desbloqueado
                    window.location.reload(); 

                } catch (purchaseError) {
                    console.error("Erro ao simular compra:", purchaseError);
                    alert('Erro ao tentar comprar o conteúdo. Verifique seu saldo ou tente novamente.');
                }
            });
        }

        feedPostsContainer.appendChild(postElement);
    }

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

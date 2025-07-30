// public/js/create-post.js

import { db, auth, storage } from './firebase-config.js'; // Importa Firestore, Auth e Storage
import { collection, addDoc, Timestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener('DOMContentLoaded', async () => {
    const createPostForm = document.getElementById('create-post-form');
    const postTextInput = document.getElementById('post-text');
    const postMediaInput = document.getElementById('post-media');
    const isPpvCheckbox = document.getElementById('is-ppv');
    const ppvPriceGroup = document.getElementById('ppv-price-group');
    const postPriceInput = document.getElementById('post-price');
    const postSubmitBtn = document.getElementById('post-submit-btn');
    const postStatusMessage = document.getElementById('post-status-message');
    const fileNameDisplay = document.getElementById('file-name-display');
    const mediaPreview = document.getElementById('media-preview');

    let currentUser = null; // Usuário logado

    // Ouve mudanças no estado de autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log("Usuário logado na criação de post:", currentUser.uid);
            
            // Verifica se o usuário é uma criadora antes de permitir a criação de posts
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists() || userDocSnap.data().accountType !== 'creator') {
                alert("Apenas criadoras podem criar postagens. Você será redirecionado para o feed.");
                window.location.href = 'feed.html';
            }
        } else {
            console.log("Nenhum usuário logado. Redirecionando para login.");
            window.location.href = 'index.html'; // Redireciona para o login se não houver usuário logado
        }
    });

    // Toggle do campo de preço PPV
    isPpvCheckbox.addEventListener('change', () => {
        if (isPpvCheckbox.checked) {
            ppvPriceGroup.style.display = 'block';
            postPriceInput.setAttribute('required', 'true');
        } else {
            ppvPriceGroup.style.display = 'none';
            postPriceInput.removeAttribute('required');
            postPriceInput.value = ''; // Limpa o valor quando desativado
        }
    });

    // Preview da mídia selecionada
    postMediaInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            mediaPreview.innerHTML = ''; // Limpa o preview anterior

            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    mediaPreview.appendChild(img);
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.src = e.target.result;
                    video.controls = true;
                    video.autoplay = false; // Não autoplay no preview
                    mediaPreview.appendChild(video);
                }
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
            mediaPreview.innerHTML = '';
        }
    });

    // Lidar com o envio do formulário
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            displayStatusMessage("Erro: Você não está logado.", "error");
            return;
        }

        const postText = postTextInput.value.trim();
        const postMediaFile = postMediaInput.files[0];
        const isPpv = isPpvCheckbox.checked;
        const postPrice = isPpv ? parseFloat(postPriceInput.value) : 0;

        if (!postText || !postMediaFile) {
            displayStatusMessage("Por favor, preencha a legenda e selecione uma mídia.", "error");
            return;
        }

        if (isPpv && (isNaN(postPrice) || postPrice <= 0)) {
            displayStatusMessage("Por favor, insira um preço válido para o conteúdo PPV.", "error");
            return;
        }

        postSubmitBtn.disabled = true;
        postStatusMessage.textContent = 'Publicando postagem...';
        postStatusMessage.classList.remove('success', 'error');
        postStatusMessage.classList.add('info'); // Uma classe para status de carregamento

        try {
            // 1. Upload da mídia para o Firebase Storage
            const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${postMediaFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, postMediaFile);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    postStatusMessage.textContent = `Upload: ${progress.toFixed(2)}%`;
                }, 
                (error) => {
                    console.error("Erro no upload da mídia:", error);
                    displayStatusMessage("Erro ao fazer upload da mídia. Tente novamente.", "error");
                    postSubmitBtn.disabled = false;
                }, 
                async () => {
                    // 2. Obter a URL de download da mídia
                    const mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    const mediaType = postMediaFile.type.startsWith('image/') ? 'image' : 'video';

                    // 3. Salvar os dados da postagem no Firestore
                    await addDoc(collection(db, "posts"), {
                        creatorId: currentUser.uid,
                        text: postText,
                        mediaUrl: mediaUrl,
                        type: mediaType,
                        createdAt: Timestamp.now(), // Firestore Timestamp
                        likes: [],
                        comments: [],
                        price: postPrice,
                        purchases: [] // Lista de UIDs de usuários que compraram o PPV
                    });

                    displayStatusMessage("Postagem criada com sucesso! Redirecionando...", "success");
                    // Limpar formulário e redirecionar
                    createPostForm.reset();
                    fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
                    mediaPreview.innerHTML = '';
                    isPpvCheckbox.checked = false;
                    ppvPriceGroup.style.display = 'none';
                    postPriceInput.value = '';

                    // Redireciona para o perfil da criadora após um pequeno atraso
                    setTimeout(() => {
                        window.location.href = `criadora.html?id=${currentUser.uid}`;
                    }, 2000); 
                }
            );

        } catch (error) {
            console.error("Erro ao criar postagem:", error);
            displayStatusMessage("Erro ao criar postagem. Verifique o console.", "error");
            postSubmitBtn.disabled = false;
        }
    });

    /**
     * Exibe mensagens de status para o usuário.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - Tipo da mensagem ('success' ou 'error').
     */
    function displayStatusMessage(message, type) {
        postStatusMessage.textContent = message;
        postStatusMessage.classList.remove('info', 'success', 'error');
        postStatusMessage.classList.add(type);
    }
});

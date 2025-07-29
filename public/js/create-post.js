// public/js/create-post.js

import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

// As credenciais do Cloudinary para upload não assinado.
// PEGAR SEU CLOUD NAME NO DASHBOARD DO CLOUDINARY
// Por exemplo: 'dzxyr0a2d' (substitua pelo seu!)
const CLOUDINARY_CLOUD_NAME = 'dblahe34z'; 
// PEGAR O NOME DO SEU PRESET DE UPLOAD NÃO ASSINADO QUE VOCÊ CRIOU NO CLOUDINARY
const CLOUDINARY_UPLOAD_PRESET = 'zafyre_posts_unsigned'; 

const db = getFirestore(app);
const auth = getAuth(app);

const createPostForm = document.getElementById('create-post-form');
const mediaUploadInput = document.getElementById('media-upload');
const captionInput = document.getElementById('caption-input');
const postButton = document.getElementById('post-button');
const mediaPreviewImage = document.getElementById('media-preview');
const videoPreview = document.getElementById('video-preview');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const uploadStatus = document.getElementById('upload-status');

let currentUserId = null;

// --- Autenticação ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado na tela de Criar Post:", currentUserId);
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/'; // Redireciona para a página de login
    }
});

// --- Prévia da Mídia Selecionada ---
mediaUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        uploadPlaceholder.classList.add('hidden'); // Esconde o placeholder
        const fileType = file.type;

        if (fileType.startsWith('image/')) {
            mediaPreviewImage.src = URL.createObjectURL(file);
            mediaPreviewImage.classList.remove('hidden');
            mediaPreviewImage.classList.add('visible');
            videoPreview.classList.add('hidden'); // Esconde a prévia do vídeo
            videoPreview.src = ''; // Limpa a URL do vídeo
        } else if (fileType.startsWith('video/')) {
            videoPreview.src = URL.createObjectURL(file);
            videoPreview.classList.remove('hidden');
            videoPreview.classList.add('visible');
            mediaPreviewImage.classList.add('hidden'); // Esconde a prévia da imagem
            mediaPreviewImage.src = '#'; // Limpa a URL da imagem
        } else {
            alert('Formato de arquivo não suportado. Por favor, selecione uma imagem ou vídeo.');
            mediaUploadInput.value = ''; // Limpa a seleção
            uploadPlaceholder.classList.remove('hidden');
            mediaPreviewImage.classList.add('hidden');
            videoPreview.classList.add('hidden');
        }
    } else {
        uploadPlaceholder.classList.remove('hidden');
        mediaPreviewImage.classList.add('hidden');
        videoPreview.classList.add('hidden');
    }
});

// --- Envio do Formulário ---
createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUserId) {
        alert("Você precisa estar logado para criar um post.");
        return;
    }

    const file = mediaUploadInput.files[0];
    const caption = captionInput.value.trim();

    if (!file) {
        uploadStatus.textContent = 'Por favor, selecione uma imagem ou vídeo.';
        uploadStatus.style.color = 'red';
        uploadStatus.classList.remove('hidden');
        return;
    }

    postButton.disabled = true; // Desabilita o botão para evitar múltiplos envios
    postButton.textContent = 'Publicando...';
    uploadStatus.classList.remove('hidden');
    uploadStatus.style.color = 'var(--primary-yellow)';
    uploadStatus.textContent = 'Iniciando upload...';

    const fileType = file.type;
    const mediaType = fileType.startsWith('image/') ? 'image' : 'video';

    // --- Lógica de Upload para Cloudinary ---
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // Seu preset não assinado
    formData.append('folder', `zafyre_posts/${currentUserId}`); // Opcional: organiza por usuário

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${mediaType}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
        }

        const data = await response.json();
        const downloadURL = data.secure_url; // URL segura do arquivo no Cloudinary
        console.log('Arquivo Cloudinary disponível em', downloadURL);

        // Salvar informações do post no Firestore
        await addDoc(collection(db, "posts"), {
            userId: currentUserId,
            caption: caption,
            mediaUrl: downloadURL,
            mediaType: mediaType,
            timestamp: serverTimestamp(),
            likesCount: 0, // Inicializa com 0 likes
            commentsCount: 0 // Inicializa com 0 comentários
        });

        uploadStatus.textContent = 'Post publicado com sucesso!';
        uploadStatus.style.color = 'lightgreen';
        console.log("Post salvo no Firestore!");

        // Limpar formulário e redirecionar após um pequeno atraso
        setTimeout(() => {
            captionInput.value = '';
            mediaUploadInput.value = '';
            mediaPreviewImage.src = '#';
            mediaPreviewImage.classList.add('hidden');
            videoPreview.src = '';
            videoPreview.classList.add('hidden');
            uploadPlaceholder.classList.remove('hidden');
            uploadStatus.classList.add('hidden');
            postButton.disabled = false;
            postButton.textContent = 'Publicar';
            window.location.href = 'feed.html'; // Redireciona para o feed
        }, 2000); // 2 segundos antes de redirecionar

    } catch (error) {
        console.error("Erro ao fazer upload ou salvar post:", error);
        uploadStatus.textContent = `Erro: ${error.message}`;
        uploadStatus.style.color = 'red';
        postButton.disabled = false;
        postButton.textContent = 'Publicar';
    }
});

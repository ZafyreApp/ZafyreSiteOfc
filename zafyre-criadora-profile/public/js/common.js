// common.js
document.addEventListener('DOMContentLoaded', () => {
    // Função para exibir mensagens de erro
    function showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = message;
        document.body.appendChild(errorContainer);
        setTimeout(() => {
            errorContainer.remove();
        }, 3000);
    }

    // Função para manipulação de eventos de clique
    function addClickEvent(selector, callback) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('click', callback);
        });
    }

    // Função para atualizar a grade de postagens
    function updatePostGrid(posts) {
        const grid = document.getElementById('post-grid');
        grid.innerHTML = ''; // Limpa a grade atual
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            postElement.innerHTML = `
                <img src="${post.image}" alt="Post Image" class="post-image">
                <div class="post-info">
                    <p>${post.caption}</p>
                    <span>${post.likes} curtidas</span>
                </div>
            `;
            grid.appendChild(postElement);
        });
    }

    // Função para carregar postagens da criadora
    async function loadCreatorPosts(creatorId) {
        try {
            const response = await fetch(`/api/creators/${creatorId}/posts`);
            const posts = await response.json();
            updatePostGrid(posts);
        } catch (error) {
            showError('Erro ao carregar postagens.');
        }
    }

    // Inicializa a página com as postagens da criadora
    const creatorId = document.body.dataset.creatorId;
    loadCreatorPosts(creatorId);

    // Adiciona eventos para botões
    addClickEvent('.edit-profile-btn', () => {
        // Lógica para editar perfil
    });

    addClickEvent('.start-chat-btn', () => {
        // Lógica para iniciar chat
    });
});
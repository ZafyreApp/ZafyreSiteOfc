// public/js/user-profile.js
import { auth, db, storage } from './firebase-config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.currentUser;
    if (!user) {
        console.log("Nenhum usuário logado. Redirecionando para login.");
        window.location.href = 'index.html';
        return;
    }

    const userId = user.uid;
    const userDocRef = doc(db, "users", userId);

    const profilePictureElement = document.getElementById('user-profile-picture');
    const displayNameElement = document.getElementById('user-display-name');
    const bioElement = document.getElementById('user-bio');
    const followersCountElement = document.getElementById('user-followers-count');
    const followingCountElement = document.getElementById('user-following-count');
    const postsCountElement = document.getElementById('user-posts-count');
    const userActivityFeed = document.getElementById('user-activity-feed');

    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeModalButtons = document.querySelectorAll('.modal .close-button');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editDisplayNameInput = document.getElementById('edit-display-name');
    const editBioTextarea = document.getElementById('edit-bio');
    const editProfilePictureInput = document.getElementById('edit-profile-picture-input');
    const currentProfilePicName = document.getElementById('current-profile-pic-name');
    const editProfileStatus = document.getElementById('edit-profile-status');

    let selectedProfileFile = null;

    // Função para carregar os dados do perfil
    async function loadUserProfile() {
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                profilePictureElement.src = userData.profilePicture || 'assets/default-avatar.png';
                displayNameElement.textContent = userData.displayName || 'Usuário';
                bioElement.textContent = userData.bio || 'Bem-vindo(a) ao meu perfil na Zafyre!';
                followersCountElement.textContent = userData.followers || 0;
                followingCountElement.textContent = userData.following || 0;
                postsCountElement.textContent = userData.posts || 0; // Pode ser posts curtidos/salvos
                
                // Preencher o modal de edição
                editDisplayNameInput.value = userData.displayName || '';
                editBioTextarea.value = userData.bio || '';
                currentProfilePicName.textContent = 'Nenhuma imagem selecionada.';

                // Exemplo de como carregar atividades (futuro)
                // userActivityFeed.innerHTML = '';
                // if (userData.likedPosts && userData.likedPosts.length > 0) {
                //     // Lógica para buscar e exibir posts curtidos
                // } else {
                //     userActivityFeed.innerHTML = '<div class="no-activity-message">Nenhuma atividade recente para mostrar.</div>';
                // }

            } else {
                console.log("Nenhum documento de perfil de usuário encontrado!");
                // Redirecionar para criação de perfil ou usar dados padrão
            }
        } catch (error) {
            console.error("Erro ao carregar perfil do usuário:", error);
        }
    }

    // Carregar perfil ao carregar a página
    await loadUserProfile();

    // Lógica para abrir/fechar o modal de edição
    editProfileBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'block';
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            editProfileModal.style.display = 'none';
            editProfileStatus.textContent = ''; // Limpar mensagem de status
            selectedProfileFile = null; // Limpar arquivo selecionado
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == editProfileModal) {
            editProfileModal.style.display = 'none';
            editProfileStatus.textContent = '';
            selectedProfileFile = null;
        }
    });

    // Lógica para upload de imagem de perfil
    editProfilePictureInput.addEventListener('change', (event) => {
        selectedProfileFile = event.target.files[0];
        if (selectedProfileFile) {
            currentProfilePicName.textContent = selectedProfileFile.name;
        } else {
            currentProfilePicName.textContent = 'Nenhuma imagem selecionada.';
        }
    });

    // Lógica para salvar edições do perfil
    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newDisplayName = editDisplayNameInput.value.trim();
        const newBio = editBioTextarea.value.trim();
        let newProfilePictureUrl = profilePictureElement.src; // Manter a URL atual por padrão

        editProfileStatus.textContent = 'Salvando...';
        editProfileStatus.className = 'status-message'; // Limpa classes anteriores

        try {
            if (selectedProfileFile) {
                const storageRef = ref(storage, `profilePictures/${userId}/${selectedProfileFile.name}`);
                await uploadBytes(storageRef, selectedProfileFile);
                newProfilePictureUrl = await getDownloadURL(storageRef);
                console.log("Nova foto de perfil carregada:", newProfilePictureUrl);
            }

            await updateDoc(userDocRef, {
                displayName: newDisplayName,
                bio: newBio,
                profilePicture: newProfilePictureUrl
            });

            sessionStorage.setItem('displayName', newDisplayName);
            sessionStorage.setItem('profilePicture', newProfilePictureUrl);

            editProfileStatus.textContent = 'Perfil atualizado com sucesso!';
            editProfileStatus.classList.add('success');
            console.log("Perfil atualizado no Firestore.");

            // Recarregar os dados do perfil na página
            await loadUserProfile();

            // Fechar modal após um pequeno atraso
            setTimeout(() => {
                editProfileModal.style.display = 'none';
                editProfileStatus.textContent = '';
                selectedProfileFile = null;
            }, 1500);

        } catch (error) {
            editProfileStatus.textContent = 'Erro ao salvar perfil. Tente novamente.';
            editProfileStatus.classList.add('error');
            console.error("Erro ao salvar perfil:", error);
        }
    });
});

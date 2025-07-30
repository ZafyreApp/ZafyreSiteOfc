// public/js/common.js
import { auth, db } from './firebase-config.js';
import { logoutUser } from './firebase-auth.js';
import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    const profileLink = document.getElementById('profile-link');
    const profileLinkMobile = document.getElementById('profile-link-mobile');
    const sidebarSubscriptionLink = document.getElementById('sidebar-subscription-link'); // Novo link de Assinaturas na sidebar para usuários
    const mobileSubscriptionLink = document.getElementById('mobile-subscription-link'); // Novo link de Assinaturas no mobile para usuários

    // Adiciona event listeners para os botões de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

    if (logoutButtonMobile) {
        logoutButtonMobile.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

    // Lógica para exibir/esconder a barra de navegação móvel ao rolar
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            let scrollTop = window.scrollY || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) {
                // Rolando para baixo
                mobileNav.classList.remove('show-mobile-nav');
            } else {
                // Rolando para cima
                if (scrollTop > 50) { // Mostra a barra após rolar 50px do topo
                    mobileNav.classList.add('show-mobile-nav');
                } else {
                    mobileNav.classList.remove('show-mobile-nav');
                }
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Para iOS
        });
    }

    // Listener de estado de autenticação para atualizar links e verificar sessão
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userUid = user.uid;
            sessionStorage.setItem('userUid', userUid); // Garante que UID está no sessionStorage

            // Usa onSnapshot para real-time updates do perfil
            onSnapshot(doc(db, "users", userUid), (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const userType = userData.userType;
                    const displayName = userData.displayName || user.email.split('@')[0];
                    const profilePicture = userData.profilePicture || 'assets/default-avatar.png';
                    const isPremium = userData.isPremium || false;

                    // Atualiza sessionStorage com os dados mais recentes
                    sessionStorage.setItem('userType', userType);
                    sessionStorage.setItem('displayName', displayName);
                    sessionStorage.setItem('profilePicture', profilePicture);
                    sessionStorage.setItem('isPremium', isPremium);

                    // Atualiza links de perfil na sidebar e mobile
                    updateProfileLinks(userType);
                    
                    // Mostra/esconde links de acordo com o tipo de usuário
                    if (userType === 'creator') {
                        if (sidebarSubscriptionLink) sidebarSubscriptionLink.style.display = 'none';
                        if (mobileSubscriptionLink) mobileSubscriptionLink.style.display = 'none';
                    } else { // 'user'
                        if (sidebarSubscriptionLink) sidebarSubscriptionLink.style.display = 'list-item'; // Assinaturas visível
                        if (mobileSubscriptionLink) mobileSubscriptionLink.style.display = 'flex'; // Assinaturas visível
                    }

                } else {
                    console.warn("Documento do usuário não encontrado no Firestore para", user.uid);
                    // Lidar com o caso de documento não encontrado (pode ser um erro ou usuário recém-criado sem doc)
                    // Redirecionar para index.html ou criar um perfil básico
                    logoutUser(); // Força logout para evitar loops
                }
            }, (error) => {
                console.error("Erro ao ouvir updates do documento do usuário:", error);
                logoutUser(); // Força logout em caso de erro na leitura
            });

        } else {
            // Usuário não logado, limpa sessões e redireciona
            sessionStorage.clear();
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/index.html';
            }
        }
    });

    // Função para atualizar os links de perfil na sidebar e na navegação móvel
    function updateProfileLinks(userType) {
        if (profileLink) {
            profileLink.href = userType === 'creator' ? '/criadora' : '/user-profile';
        }
        if (profileLinkMobile) {
            profileLinkMobile.href = userType === 'creator' ? '/criadora' : '/user-profile';
        }
    }
});

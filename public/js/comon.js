// public/js/common.js
import { auth, db } from './firebase-config.js';
import { logoutUser } from './firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');

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

    // Lógica para exibir a barra de navegação móvel
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { // Mostra a barra após rolar 50px
                mobileNav.classList.add('show-mobile-nav');
            } else {
                mobileNav.classList.remove('show-mobile-nav');
            }
        });
    }

    // Lógica para redirecionar o link do perfil com base no tipo de usuário
    const profileLink = document.getElementById('profile-link');
    const profileLinkMobile = document.getElementById('profile-link-mobile');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userType = sessionStorage.getItem('userType');
            const userUid = sessionStorage.getItem('userUid'); // Certifica que o UID está no session storage
            
            // Se userType não estiver no sessionStorage, buscar do Firestore
            if (!userType) {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    sessionStorage.setItem('userType', userData.userType);
                    sessionStorage.setItem('displayName', userData.displayName || user.email.split('@')[0]);
                    sessionStorage.setItem('profilePicture', userData.profilePicture || 'assets/default-avatar.png');
                    sessionStorage.setItem('userUid', user.uid); // Salva o UID também
                    
                    updateProfileLinks(userData.userType);
                } else {
                    console.warn("Documento do usuário não encontrado no Firestore para", user.uid);
                    // Caso o documento não exista (erro na criação anterior), redireciona como usuário comum
                    sessionStorage.setItem('userType', 'user');
                    sessionStorage.setItem('displayName', user.email.split('@')[0]);
                    sessionStorage.setItem('profilePicture', 'assets/default-avatar.png');
                    sessionStorage.setItem('userUid', user.uid);
                    updateProfileLinks('user');
                }
            } else {
                updateProfileLinks(userType);
            }

            // Atualizar o avatar e nome de exibição no cabeçalho se houver (futuro)
            // const headerProfilePic = document.getElementById('header-profile-pic');
            // const headerDisplayName = document.getElementById('header-display-name');
            // if (headerProfilePic && headerDisplayName) {
            //     headerProfilePic.src = sessionStorage.getItem('profilePicture') || 'assets/default-avatar.png';
            //     headerDisplayName.textContent = sessionStorage.getItem('displayName');
            // }

        } else {
            // Usuário não logado, remove informações e redireciona para index.html
            sessionStorage.removeItem('userType');
            sessionStorage.removeItem('userUid');
            sessionStorage.removeItem('displayName');
            sessionStorage.removeItem('profilePicture');
            // Se a página atual não for index.html, redireciona
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    });

    function updateProfileLinks(userType) {
        if (profileLink && profileLinkMobile) {
            if (userType === 'creator') {
                profileLink.href = 'criadora.html';
                profileLinkMobile.href = 'criadora.html';
            } else {
                profileLink.href = 'user-profile.html';
                profileLinkMobile.href = 'user-profile.html';
            }
        }
    }
});

// public/js/home.js

import { registerUserWithEmail, loginUserWithEmail, loginUserWithGoogle, logoutUser } from './firebase-auth.js';
import { auth } from './firebase-config.js'; // Para checar o estado da autenticação

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const authTitle = document.getElementById('auth-title');

    // Função para alternar entre formulários de login e registro
    function toggleAuthForms(showLogin = true) {
        if (showLogin) {
            loginForm.style.display = 'flex'; // Display flex para alinhar inputs em coluna
            registerForm.style.display = 'none';
            authTitle.textContent = 'Bem-vindo(a) de Volta!';
            showRegisterLink.closest('.switch-mode').style.display = 'block'; // Mostra "Não tem conta?"
            showLoginLink.closest('.switch-mode').style.display = 'none';    // Oculta "Já tem conta?"
            googleLoginBtn.style.display = 'block';
            document.querySelector('.or-divider').style.display = 'block';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
            authTitle.textContent = 'Criar Sua Conta';
            showRegisterLink.closest('.switch-mode').style.display = 'none';
            showLoginLink.closest('.switch-mode').style.display = 'block';
            googleLoginBtn.style.display = 'none';
            document.querySelector('.or-divider').style.display = 'none';
        }
    }

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms(false);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms(true);
    });

    // Lógica de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('#login-email').value;
        const password = loginForm.querySelector('#login-password').value;

        try {
            const { user } = await loginUserWithEmail(email, password);
            alert('Login bem-sucedido!');
            // Redirecionar com base no tipo de usuário seria feito APÓS buscar o tipo de conta no Firestore.
            // Por enquanto, vamos para o feed ou para uma página de carregamento.
            window.location.href = 'feed.html'; // Redireciona para o feed
        } catch (error) {
            alert('Erro no login: ' + error.message);
        }
    });

    // Lógica de Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.querySelector('#register-name').value;
        const email = registerForm.querySelector('#register-email').value;
        const password = registerForm.querySelector('#register-password').value;
        const accountType = registerForm.querySelector('#register-account-type').value;

        try {
            const { user } = await registerUserWithEmail(email, password, name, accountType);
            alert(`Conta de ${accountType} criada com sucesso!`);
            // Redirecionar para o perfil ou feed, dependendo do tipo de conta
            if (accountType === 'creator') {
                window.location.href = 'criadora.html';
            } else {
                window.location.href = 'usuario.html';
            }
        } catch (error) {
            alert('Erro no registro: ' + error.message);
        }
    });

    // Lógica de Login com Google
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const { user } = await loginUserWithGoogle();
            alert('Login com Google bem-sucedido!');
            // Para usuários Google recém-registrados, você pode querer levá-los a uma página
            // para completar o perfil e escolher o tipo de conta (se não for feito automaticamente).
            window.location.href = 'feed.html'; // Redireciona para o feed
        } catch (error) {
            alert('Erro no login com Google: ' + error.message);
        }
    });

    // Checa o estado da autenticação ao carregar a página
    // Isso é útil para manter o usuário logado se ele já estiver
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Usuário já logado:", user.uid);
            // Aqui você faria uma consulta ao Firestore para obter o tipo de conta
            // e redirecionar para o perfil correto ou feed.
            // Para simplificar, vamos redirecionar para o feed por enquanto:
            window.location.href = 'feed.html';
        } else {
            console.log("Nenhum usuário logado.");
            // Garante que o formulário de login esteja visível se ninguém estiver logado
            toggleAuthForms(true);
        }
    });
});

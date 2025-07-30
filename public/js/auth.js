// public/js/auth.js
import { registerUser, loginUser } from './firebase-auth.js';
import { showStatusMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const toggleToRegisterBtn = document.getElementById('toggle-to-register');
    const toggleToLoginBtn = document.getElementById('toggle-to-login');
    const statusMessage = document.getElementById('auth-status-message');

    // Inicialmente, mostra o formulário de login
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';

    // Toggle entre formulários de Login e Registro
    if (toggleToRegisterBtn) {
        toggleToRegisterBtn.addEventListener('click', () => {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
            statusMessage.textContent = ''; // Limpa mensagens de status
        });
    }

    if (toggleToLoginBtn) {
        toggleToLoginBtn.addEventListener('click', () => {
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            statusMessage.textContent = ''; // Limpa mensagens de status
        });
    }

    // Lógica de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;
            const isCreator = document.getElementById('is-creator-checkbox').checked;
            
            const userType = isCreator ? 'creator' : 'user';

            showStatusMessage(statusMessage, 'Registrando...', 'info', 0); // Mostra mensagem sem tempo limite
            const result = await registerUser(email, password, userType);

            if (result.success) {
                showStatusMessage(statusMessage, 'Registro bem-sucedido! Redirecionando...', 'success');
                // Redirecionamento é tratado pelo common.js ou firebase-auth.js listener
                // Para garantir, podemos adicionar um pequeno atraso aqui
                setTimeout(() => {
                    if (userType === 'creator') {
                        window.location.href = '/criadora';
                    } else {
                        window.location.href = '/feed';
                    }
                }, 1500);
            } else {
                showStatusMessage(statusMessage, 'Erro no registro: ' + result.error.message, 'error');
            }
        });
    }

    // Lógica de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;

            showStatusMessage(statusMessage, 'Entrando...', 'info', 0); // Mostra mensagem sem tempo limite
            const result = await loginUser(email, password);

            if (result.success) {
                showStatusMessage(statusMessage, 'Login bem-sucedido! Redirecionando...', 'success');
                // Redirecionamento é tratado pelo common.js ou firebase-auth.js listener
                 setTimeout(() => {
                    // Após o login, o onAuthStateChanged em firebase-auth.js e common.js cuidará do redirecionamento
                    // Mas podemos dar uma direção inicial aqui se o sessionStorage já tiver o userType
                    const userType = sessionStorage.getItem('userType');
                     if (userType === 'creator') {
                        window.location.href = '/criadora';
                    } else {
                        window.location.href = '/feed';
                    }
                }, 1500);
            } else {
                showStatusMessage(statusMessage, 'Erro no login: ' + result.error.message, 'error');
            }
        });
    }
});

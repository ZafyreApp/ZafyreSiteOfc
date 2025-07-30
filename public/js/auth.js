// Exemplo de como seria no seu script de login/registro (ex: public/js/auth.js)
import { registerUser, loginUser } from './firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const isCreator = document.getElementById('is-creator-checkbox').checked; // Obtém o valor do checkbox
            
            const userType = isCreator ? 'creator' : 'user';

            const result = await registerUser(email, password, userType); // Passa o userType
            if (result.success) {
                alert('Registro bem-sucedido! Redirecionando...');
                // Redireciona com base no userType após o registro
                if (userType === 'creator') {
                    window.location.href = 'criadora.html';
                } else {
                    window.location.href = 'feed.html'; // Usuários comuns podem ir para o feed
                }
            } else {
                alert('Erro no registro: ' + result.error.message);
            }
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            const result = await loginUser(email, password);
            if (result.success) {
                // Ao logar, o common.js já vai carregar o userType e redirecionar
                // ou você pode pegar do sessionStorage aqui para decidir
                const userType = sessionStorage.getItem('userType');
                if (userType === 'creator') {
                    window.location.href = 'criadora.html';
                } else {
                    window.location.href = 'feed.html';
                }
                
            } else {
                alert('Erro no login: ' + result.error.message);
            }
        });
    }
});

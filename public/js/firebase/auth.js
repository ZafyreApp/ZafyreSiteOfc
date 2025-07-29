
// public/js/auth.js

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, configurando eventos de autenticação...');
    
    // Verifica se o Firebase foi configurado corretamente
    try {
        auth.app; // Testa se a instância existe
    } catch (error) {
        console.error('Erro na configuração do Firebase:', error);
        alert('Erro na configuração do Firebase. Verifique as credenciais.');
        return;
    }

    // --- LÓGICA DE LOGIN ---
    const loginEmailBtn = document.getElementById('loginEmailBtn');
    if (loginEmailBtn) {
        loginEmailBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Usuário logado com sucesso!", userCredential.user.uid);
                
                // Pequena pausa antes do redirecionamento
                setTimeout(() => {
                    window.location.href = '/my-profile.html';
                }, 500);
            } catch (error) {
                console.error("Erro de login:", error);
                alert(`Erro de login: ${getErrorMessage(error.code)}`);
            }
        });
    }

    // --- LÓGICA DE CADASTRO ---
    const registerEmailBtn = document.getElementById('registerEmailBtn');
    if (registerEmailBtn) {
        registerEmailBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!email || !password) {
                alert('Por favor, preencha pelo menos email e senha.');
                return;
            }

            if (password !== confirmPassword) {
                alert('As senhas não coincidem!');
                return;
            }

            if (password.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Usuário cadastrado com sucesso!");
                
                // Opcional: Salvar nome do usuário no Firestore
                if (name) {
                    // Aqui você pode salvar informações adicionais no Firestore
                    console.log('Nome do usuário:', name);
                }
                
                window.location.href = '/my-profile.html';
            } catch (error) {
                console.error("Erro de cadastro:", error.message);
                alert(`Erro de cadastro: ${getErrorMessage(error.code)}`);
            }
        });
    }

    // --- LOGIN COM GOOGLE ---
    const loginGoogleBtn = document.getElementById('loginGoogleBtn');
    const registerGoogleBtn = document.getElementById('registerGoogleBtn');
    
    if (loginGoogleBtn) {
        loginGoogleBtn.addEventListener('click', handleGoogleAuth);
    }
    
    if (registerGoogleBtn) {
        registerGoogleBtn.addEventListener('click', handleGoogleAuth);
    }

    // --- LOGOUT ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("Usuário deslogado com sucesso!");
                window.location.href = '/';
            } catch (error) {
                console.error("Erro ao fazer logout:", error.message);
                alert(`Erro ao fazer logout: ${error.message}`);
            }
        });
    }

    // --- LISTENER DE ESTADO DE AUTENTICAÇÃO ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuário autenticado:", user.uid);
            
            // Se estiver na página de login e já estiver logado, redireciona
            if (window.location.pathname === '/' || window.location.pathname === '/login.html') {
                window.location.href = '/my-profile.html';
            }
        } else {
            console.log("Nenhum usuário autenticado.");
            
            // Se estiver numa página protegida e não estiver logado, redireciona
            const protectedPages = ['/my-profile.html', '/feed.html', '/chat.html', '/notifications.html'];
            if (protectedPages.includes(window.location.pathname)) {
                window.location.href = '/';
            }
        }
    });
});

// Função para login/cadastro com Google
async function handleGoogleAuth(e) {
    e.preventDefault();
    
    try {
        // Configura o provider do Google
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, googleProvider);
        console.log("Login com Google realizado com sucesso!", result.user.uid);
        
        // Pequena pausa antes do redirecionamento
        setTimeout(() => {
            window.location.href = '/my-profile.html';
        }, 500);
    } catch (error) {
        console.error("Erro no login com Google:", error);
        if (error.code === 'auth/popup-closed-by-user') {
            // Não mostra alerta se o usuário apenas fechou o popup
            return;
        }
        alert(`Erro no login com Google: ${getErrorMessage(error.code)}`);
    }
}

// Função para traduzir códigos de erro
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'Este email já está sendo usado.',
        'auth/weak-password': 'A senha é muito fraca.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/popup-closed-by-user': 'Janela de login fechada pelo usuário.',
        'auth/popup-blocked': 'Pop-up bloqueado pelo navegador.'
    };
    
    return errorMessages[errorCode] || 'Erro desconhecido.';
}

// Exporta a instância de auth para uso em outros módulos
export { auth };

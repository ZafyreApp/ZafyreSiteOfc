// public/js/firebase-auth.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Função de Registro
async function registerUser(email, password, userType = 'user') { // Adiciona userType com padrão 'user'
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salvar informações adicionais do usuário no Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            createdAt: new Date(),
            userType: userType, // 'creator' ou 'user'
            displayName: email.split('@')[0], // Nome de exibição inicial
            profilePicture: 'assets/default-avatar.png', // Avatar padrão
            bio: userType === 'creator' ? 'Bem-vindo ao meu perfil na Zafyre! Sou uma criadora de conteúdo.' : 'Olá! Sou um novo membro da Zafyre.',
            followers: 0,
            following: 0,
            postsCount: 0, // Para posts criados (criadora) ou curtidos (usuário)
            likesReceived: 0, // Para criadoras
            isPremium: false, // Status premium
            zafyreCoins: 0, // Saldo inicial
            // Campos específicos para criadoras
            referralCode: userType === 'creator' ? generateReferralCode() : null,
            referrals: [], // Criadoras indicadas
            ppvPrices: { monthly: 9.99, quarterly: 29.99, semiannual: 59.99, item: 1.99 }, // Preços padrão
            balanceBRL: 0, // Saldo real para saque (criadoras)
            // Campos específicos para usuários
            followedCreators: [], // Lista de IDs de criadoras seguidas
            purchasedContent: [] // Lista de IDs de conteúdo PPV comprado
        });

        console.log("Usuário registrado e perfil no Firestore criado:", user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error("Erro no registro:", error);
        return { success: false, error: error };
    }
}

// Função para gerar código de indicação simples
function generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}


// Função de Login
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Usuário logado:", user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error("Erro no login:", error);
        return { success: false, error: error };
    }
}

// Função de Logout
function logoutUser() {
    signOut(auth).then(() => {
        console.log("Usuário deslogado.");
        sessionStorage.clear(); // Limpa todas as sessões
        window.location.href = 'index.html'; // Redireciona para a página de login
    }).catch((error) => {
        console.error("Erro ao deslogar:", error);
    });
}

// Listener para o estado de autenticação
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Tenta obter o tipo de usuário e outros dados do sessionStorage primeiro
        let userType = sessionStorage.getItem('userType');
        let displayName = sessionStorage.getItem('displayName');
        let profilePicture = sessionStorage.getItem('profilePicture');
        let isPremium = sessionStorage.getItem('isPremium') === 'true'; // Armazenar como string

        if (!userType) { // Se não estiver no sessionStorage, busca no Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                userType = userData.userType;
                displayName = userData.displayName || user.email.split('@')[0];
                profilePicture = userData.profilePicture || 'assets/default-avatar.png';
                isPremium = userData.isPremium || false;

                // Armazenar no sessionStorage para acesso rápido em outras páginas
                sessionStorage.setItem('userType', userType);
                sessionStorage.setItem('userUid', user.uid);
                sessionStorage.setItem('displayName', displayName);
                sessionStorage.setItem('profilePicture', profilePicture);
                sessionStorage.setItem('isPremium', isPremium); // Salva como string
                
            } else {
                console.warn("Documento do usuário não encontrado no Firestore para", user.uid, ". Criando documento padrão.");
                // Cria um documento básico se não existir (para usuários antigos que logarem)
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    createdAt: new Date(),
                    userType: 'user', // Assume 'user' como padrão se não há registro anterior
                    displayName: user.email.split('@')[0],
                    profilePicture: 'assets/default-avatar.png',
                    bio: 'Olá! Sou um novo membro da Zafyre.',
                    followers: 0,
                    following: 0,
                    postsCount: 0,
                    likesReceived: 0,
                    isPremium: false,
                    zafyreCoins: 0,
                    balanceBRL: 0,
                    followedCreators: [],
                    purchasedContent: []
                });
                sessionStorage.setItem('userType', 'user');
                sessionStorage.setItem('userUid', user.uid);
                sessionStorage.setItem('displayName', user.email.split('@')[0]);
                sessionStorage.setItem('profilePicture', 'assets/default-avatar.png');
                sessionStorage.setItem('isPremium', false);
                userType = 'user'; // Garante que userType seja definido
            }
        }
        // Redirecionamento após login (será manipulado principalmente por common.js)
        // Mas se a página atual for index.html, redireciona para o feed
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
             window.location.href = '/feed'; // Redireciona para o feed após o login
        }

    } else {
        // Limpa as informações do sessionStorage se não houver usuário logado
        sessionStorage.clear();
        // Se a página atual não for index.html, redireciona para index.html
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = '/index.html';
        }
    }
});

// Exportar funções
export { registerUser, loginUser, logoutUser };

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
            userType: userType, // Salva o tipo de usuário
            // Outros campos iniciais como nome, avatar, bio podem ser adicionados aqui
            displayName: email.split('@')[0], // Nome de exibição inicial
            profilePicture: 'assets/default-avatar.png', // Avatar padrão
            bio: 'Olá! Sou um novo membro da Zafyre.',
            followers: 0,
            following: 0,
            posts: 0
        });

        console.log("Usuário registrado e perfil no Firestore criado:", user.uid);
        return { success: true, user: user };
    } catch (error) {
        console.error("Erro no registro:", error);
        return { success: false, error: error };
    }
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
        window.location.href = 'index.html'; // Redireciona para a página de login
    }).catch((error) => {
        console.error("Erro ao deslogar:", error);
    });
}

// Exportar funções para uso em outras partes do seu app
export { registerUser, loginUser, logoutUser };

// Listener para o estado de autenticação (pode ser usado em common.js ou em páginas específicas)
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Obter o tipo de usuário do Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("Usuário autenticado. Tipo de perfil:", userData.userType);
            // Armazenar o tipo de usuário em sessionStorage para acesso rápido
            sessionStorage.setItem('userType', userData.userType);
            sessionStorage.setItem('userUid', user.uid);
            sessionStorage.setItem('displayName', userData.displayName || user.email.split('@')[0]);
            sessionStorage.setItem('profilePicture', userData.profilePicture || 'assets/default-avatar.png');
        } else {
            console.warn("Documento do usuário não encontrado no Firestore para", user.uid);
            // Isso pode acontecer se o usuário foi criado antes da alteração do código
            // Você pode querer criar o documento aqui com um tipo padrão ou forçar o logout
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date(),
                userType: 'user', // Define como padrão 'user'
                displayName: user.email.split('@')[0],
                profilePicture: 'assets/default-avatar.png',
                bio: 'Olá! Sou um novo membro da Zafyre.',
                followers: 0,
                following: 0,
                posts: 0
            });
            sessionStorage.setItem('userType', 'user');
            sessionStorage.setItem('userUid', user.uid);
            sessionStorage.setItem('displayName', user.email.split('@')[0]);
            sessionStorage.setItem('profilePicture', 'assets/default-avatar.png');
        }
    } else {
        // Limpa as informações do sessionStorage se não houver usuário logado
        sessionStorage.removeItem('userType');
        sessionStorage.removeItem('userUid');
        sessionStorage.removeItem('displayName');
        sessionStorage.removeItem('profilePicture');
    }
});

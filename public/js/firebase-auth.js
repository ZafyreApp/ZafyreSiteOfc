// public/js/firebase-auth.js

import { auth, db } from './firebase-config.js'; // Importa as instâncias de auth e db
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Função para registrar um novo usuário com e-mail e senha.
 * @param {string} email - O e-mail do usuário.
 * @param {string} password - A senha do usuário.
 * @param {string} name - O nome do usuário.
 * @param {string} accountType - O tipo de conta ('creator' ou 'user').
 * @returns {Promise<Object>} Um objeto com o usuário ou um erro.
 */
export async function registerUserWithEmail(email, password, name, accountType) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Salva informações adicionais do usuário no Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            accountType: accountType,
            createdAt: new Date(),
            // Adicione aqui outros campos iniciais, se precisar (ex: seguidores: 0, curtidas: 0, saldo: 0)
            followers: 0,
            totalLikes: 0,
            zafyreCoins: 0,
            isPremium: false,
            invitationCode: accountType === 'creator' ? generateInvitationCode() : null, // Apenas criadoras
            profilePicture: 'assets/default-avatar.png' // Avatar padrão
        });

        console.log("Usuário registrado e dados salvos no Firestore:", user);
        return { user: user };
    } catch (error) {
        console.error("Erro no registro:", error.message);
        throw error; // Propaga o erro para ser tratado pelo chamador
    }
}

/**
 * Função para fazer login com e-mail e senha.
 * @param {string} email - O e-mail do usuário.
 * @param {string} password - A senha do usuário.
 * @returns {Promise<Object>} Um objeto com o usuário ou um erro.
 */
export async function loginUserWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Usuário logado com e-mail:", user);
        return { user: user };
    } catch (error) {
        console.error("Erro no login:", error.message);
        throw error;
    }
}

/**
 * Função para fazer login com Google.
 * @returns {Promise<Object>} Um objeto com o usuário ou um erro.
 */
export async function loginUserWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Verifica se é um novo usuário Google e salva no Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef); // Necessário importar getDoc

        if (!userDoc.exists()) {
            // Se o usuário Google não existe no Firestore, é um novo registro
            // Aqui você pode redirecionar para uma página onde o usuário escolhe o tipo de conta (criadora/usuário)
            // Ou definir um tipo padrão, mas o ideal é que ele escolha.
            // Para simplificar, vamos assumir um tipo padrão ou pedir para ele completar o perfil depois.
            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
                accountType: 'user', // Pode ser "user" por padrão ou pedir para escolher
                createdAt: new Date(),
                followers: 0,
                totalLikes: 0,
                zafyreCoins: 0,
                isPremium: false,
                profilePicture: user.photoURL || 'assets/default-avatar.png'
            });
            console.log("Novo usuário Google registrado e dados salvos no Firestore:", user);
        } else {
            console.log("Usuário Google logado:", user);
        }

        return { user: user };
    } catch (error) {
        console.error("Erro no login com Google:", error.message);
        throw error;
    }
}

/**
 * Função para deslogar o usuário.
 */
export async function logoutUser() {
    try {
        await auth.signOut();
        console.log("Usuário deslogado com sucesso.");
        // Redirecionar para a página de login
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Erro ao deslogar:", error.message);
        throw error;
    }
}

// Helper para gerar código de indicação (exemplo simples)
function generateInvitationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ZAFYRE';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

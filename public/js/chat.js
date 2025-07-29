// public/js/chat.js

import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Elementos HTML
const conversationsSidebar = document.getElementById('conversations-sidebar');
const conversationList = document.getElementById('conversation-list');
const noConversationsMessage = document.getElementById('no-conversations-message');
const loadingConversationsMessage = conversationList.querySelector('.loading-message'); // Ajustado para pegar o loading message dentro da conversationList

const chatWindow = document.getElementById('chat-window');
const chatHeader = chatWindow.querySelector('.chat-header');
const chatContactAvatar = document.getElementById('chat-contact-avatar');
const chatContactName = document.getElementById('chat-contact-name');
const messagesList = document.getElementById('messages-list');
const noMessagesMessage = document.getElementById('no-messages-message');
const loadingMessagesMessage = messagesList.querySelector('.loading-message'); // Ajustado para pegar o loading message dentro da messagesList

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const closeChatButton = document.getElementById('close-chat-button');

let currentUserId = null;
let currentChatId = null; // ID da conversa atualmente aberta
let unsubscribeMessages = null; // Para cancelar a escuta de mensagens em tempo real
let unsubscribeConversations = null; // Para cancelar a escuta de conversas em tempo real

// --- Autenticação e Carregamento Inicial ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado no Chat:", currentUserId);
        loadConversations(currentUserId);
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/';
    }
});

// --- Lógica de Carregamento de Conversas ---
async function loadConversations(userId) {
    loadingConversationsMessage.classList.remove('hidden');
    noConversationsMessage.classList.add('hidden');
    conversationList.innerHTML = ''; // Limpa a lista antes de carregar

    // Consulta conversas onde o usuário atual é um participante
    const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc") // Ordena pelas conversas mais recentes
    );

    // Escuta em tempo real as conversas
    unsubscribeConversations = onSnapshot(q, async (snapshot) => {
        conversationList.innerHTML = ''; // Limpa a lista novamente a cada atualização
        loadingConversationsMessage.classList.add('hidden');

        if (snapshot.empty) {
            noConversationsMessage.classList.remove('hidden');
            return;
        }

        noConversationsMessage.classList.add('hidden');

        for (const docSnapshot of snapshot.docs) {
            const conversation = docSnapshot.data();
            const chatId = docSnapshot.id;

            // Determinar o nome e avatar do contato para conversas privadas
            let contactName = "Grupo"; // Padrão para grupos ou desconhecido
            let contactAvatar = 'default-avatar.png.jpg'; // Avatar padrão

            if (conversation.type === 'private' && conversation.participants.length === 2) {
                const otherParticipantId = conversation.participants.find(id => id !== userId);
                if (otherParticipantId) {
                    try {
                        // Buscar informações do outro usuário (contactName, contactAvatar)
                        const userDoc = await getDoc(doc(db, "users", otherParticipantId)); // Assumindo coleção 'users'
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            contactName = userData.displayName || "Usuário Desconhecido";
                            contactAvatar = userData.photoURL || 'default-avatar.png.jpg';
                        } else {
                            contactName = "Usuário Removido";
                        }
                    } catch (error) {
                        console.error("Erro ao buscar dados do contato:", error);
                        contactName = "Erro de Contato";
                    }
                }
            } else if (conversation.type === 'group') {
                contactName = conversation.name || "Grupo sem nome";
                contactAvatar = conversation.imageUrl || 'default-avatar.png.jpg';
            }

            const conversationItem = document.createElement('div');
            conversationItem.classList.add('conversation-item');
            if (chatId === currentChatId) {
                conversationItem.classList.add('active');
            }
            conversationItem.dataset.chatId = chatId;

            const lastMessageText = conversation.lastMessage || "Nenhuma mensagem.";
            const lastMessageTime = conversation.lastMessageTimestamp ? formatTime(conversation.lastMessageTimestamp.toDate()) : '';

            conversationItem.innerHTML = `
                <img src="${contactAvatar}" alt="Avatar" class="conversation-avatar">
                <div class="conversation-info">
                    <span class="conversation-name">${contactName}</span>
                    <p class="last-message">${lastMessageText}</p>
                </div>
                <span class="message-time">${lastMessageTime}</span>
            `;

            conversationItem.addEventListener('click', () => openChat(chatId, contactName, contactAvatar));
            conversationList.appendChild(conversationItem);
        }
    }, (error) => {
        console.error("Erro ao carregar conversas:", error);
        loadingConversationsMessage.classList.add('hidden');
        noConversationsMessage.classList.remove('hidden'); // Exibe mensagem de erro ou sem conversas
        noConversationsMessage.textContent = 'Erro ao carregar conversas.';
    });
}

// --- Lógica para Abrir uma Conversa ---
async function openChat(chatId, contactName, contactAvatar) {
    if (unsubscribeMessages) {
        unsubscribeMessages(); // Cancela a escuta da conversa anterior
    }

    currentChatId = chatId;

    // Atualiza a UI para mostrar a janela de chat e esconder a sidebar em mobile
    chatWindow.classList.remove('hidden');
    chatWindow.classList.add('active'); // Para transição em mobile
    conversationsSidebar.classList.add('hidden-on-mobile');

    // Atualiza o header do chat
    chatContactName.textContent = contactName;
    chatContactAvatar.src = contactAvatar;

    messagesList.innerHTML = ''; // Limpa mensagens anteriores
    loadingMessagesMessage.classList.remove('hidden');
    noMessagesMessage.classList.add('hidden');

    // Remove a classe 'active' de todos os itens e adiciona ao item clicado
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        }
    });

    // Escuta em tempo real as mensagens da conversa selecionada
    const q = query(
        collection(db, "conversations", chatId, "messages"),
        orderBy("timestamp", "asc") // Ordena as mensagens do mais antigo para o mais novo
    );

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        messagesList.innerHTML = ''; // Limpa a lista a cada atualização
        loadingMessagesMessage.classList.add('hidden');

        if (snapshot.empty) {
            noMessagesMessage.classList.remove('hidden');
            return;
        }

        noMessagesMessage.classList.add('hidden');

        snapshot.forEach((doc) => {
            const message = doc.data();
            const messageItem = document.createElement('div');
            messageItem.classList.add('message-item', message.senderId === currentUserId ? 'sent' : 'received');

            const messageTime = message.timestamp ? formatTime(message.timestamp.toDate()) : '';

            messageItem.innerHTML = `
                <span class="message-text">${message.text}</span>
                <span class="message-time">${messageTime}</span>
            `;
            messagesList.appendChild(messageItem);
        });
        messagesList.scrollTop = messagesList.scrollHeight; // Rola para a mensagem mais recente
    }, (error) => {
        console.error("Erro ao carregar mensagens:", error);
        loadingMessagesMessage.classList.add('hidden');
        noMessagesMessage.classList.remove('hidden');
        noMessagesMessage.textContent = 'Erro ao carregar mensagens.';
    });
}

// --- Lógica para Fechar a Conversa (em mobile) ---
closeChatButton.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
    chatWindow.classList.remove('active');
    conversationsSidebar.classList.remove('hidden-on-mobile'); // Mostra a sidebar novamente
    currentChatId = null;
    if (unsubscribeMessages) {
        unsubscribeMessages(); // Para de escutar mensagens
    }
    messagesList.innerHTML = ''; // Limpa mensagens
});


// --- Lógica para Enviar Mensagem ---
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();

    if (messageText === '' || !currentChatId || !currentUserId) {
        return;
    }

    try {
        // Adiciona a mensagem à subcoleção 'messages' da conversa atual
        await addDoc(collection(db, "conversations", currentChatId, "messages"), {
            senderId: currentUserId,
            text: messageText,
            timestamp: serverTimestamp() // Usa o timestamp do servidor
        });

        // Atualiza a última mensagem e timestamp no documento da conversa principal
        const conversationRef = doc(db, "conversations", currentChatId);
        await updateDoc(conversationRef, {
            lastMessage: messageText,
            lastMessageTimestamp: serverTimestamp()
        });

        messageInput.value = ''; // Limpa o input
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        alert("Não foi possível enviar a mensagem. Tente novamente.");
    }
});

// --- Função Utilitária para Formatar Tempo (reutilizada) ---
function formatTime(date) {
    if (!date) return '';
    // Formata para HH:MM ou Dia/Mês para mensagens mais antigas
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 1 && date.getDate() === now.getDate()) {
        // Se for hoje, mostra a hora
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
        // Se for nos últimos 7 dias, mostra o dia da semana
        return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
        // Caso contrário, mostra a data completa
        return date.toLocaleDateString('pt-BR');
    }
}


// --- Lógica para criar uma nova conversa (simplificada) ---
// Este é um exemplo de como você pode iniciar uma nova conversa.
// Na realidade, você precisaria de uma forma de selecionar um usuário ou usuários para conversar.
// Por exemplo, clicando no perfil de alguém ou através de uma busca.
const newChatButton = document.getElementById('new-chat-button');
// O botão 'new-chat-button' deve ser exibido quando não há conversas ativas ou para iniciar uma nova.

newChatButton.addEventListener('click', async () => {
    if (!currentUserId) {
        alert("Faça login para iniciar uma nova conversa.");
        return;
    }

    const recipientId = prompt("Digite o ID do usuário com quem deseja conversar (apenas para teste):");
    if (!recipientId || recipientId === currentUserId) {
        alert("ID do destinatário inválido ou é você mesmo.");
        return;
    }

    try {
        // 1. Verificar se já existe uma conversa entre esses dois usuários
        const existingConversationsQuery1 = query(
            collection(db, "conversations"),
            where("participants", "==", [currentUserId, recipientId]),
            where("type", "==", "private")
        );
        const existingConversationsQuery2 = query(
            collection(db, "conversations"),
            where("participants", "==", [recipientId, currentUserId]),
            where("type", "==", "private")
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(existingConversationsQuery1),
            getDocs(existingConversationsQuery2)
        ]);

        let existingChatId = null;
        if (!snapshot1.empty) {
            existingChatId = snapshot1.docs[0].id;
        } else if (!snapshot2.empty) {
            existingChatId = snapshot2.docs[0].id;
        }

        if (existingChatId) {
            alert("Conversa já existe. Abrindo conversa existente.");
            const recipientUserDoc = await getDoc(doc(db, "users", recipientId));
            const recipientData = recipientUserDoc.exists() ? recipientUserDoc.data() : { displayName: "Usuário Desconhecido", photoURL: 'default-avatar.png.jpg' };
            openChat(existingChatId, recipientData.displayName, recipientData.photoURL);
        } else {
            // 2. Se não existir, criar uma nova conversa
            const newConversationRef = await addDoc(collection(db, "conversations"), {
                participants: [currentUserId, recipientId],
                type: 'private',
                lastMessage: '',
                lastMessageTimestamp: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            // Opcional: buscar dados do destinatário para passar para openChat
            const recipientUserDoc = await getDoc(doc(db, "users", recipientId));
            const recipientData = recipientUserDoc.exists() ? recipientUserDoc.data() : { displayName: "Usuário Desconhecido", photoURL: 'default-avatar.png.jpg' };

            alert("Nova conversa criada!");
            openChat(newConversationRef.id, recipientData.displayName, recipientData.photoURL);
        }

    } catch (error) {
        console.error("Erro ao iniciar nova conversa:", error);
        alert("Não foi possível iniciar uma nova conversa.");
    }
});

// public/js/zafyre-pay.js

import { getFirestore, collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js'; // Importa a instância 'app'

const db = getFirestore(app);
const auth = getAuth(app);

const checkoutButton = document.getElementById('checkout-button');
const transactionsList = document.getElementById('transactions-list');
const loadingMessage = document.querySelector('.loading-message'); // Já existe na notif.html, certifique-se que o id é único ou use querySelectorAll
const noTransactionsMessage = document.getElementById('no-transactions-message');

let currentUserId = null; // Para armazenar o UID do usuário logado

// --- 4.1. Lógica para Iniciar o Pagamento ---
checkoutButton.addEventListener('click', async () => {
    if (!currentUserId) {
        alert("Por favor, faça login para iniciar um pagamento.");
        return;
    }

    // Você pode querer coletar o valor ou item que o usuário deseja pagar aqui,
    // mas por enquanto, usaremos os valores fixos do backend.

    try {
        const response = await fetch('/criar-preferencia-pagamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Se você quiser passar dados dinâmicos do item para o backend:
            // body: JSON.stringify({
            //     itemId: 'PROD_X',
            //     itemTitle: 'Assinatura Mensal',
            //     itemQuantity: 1,
            //     itemUnitPrice: 29.90
            // })
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Preferência criada:", data.init_point);

        if (data.init_point) {
            // Redireciona o usuário para a URL de pagamento do Mercado Pago
            window.location.href = data.init_point;
        } else {
            alert('Erro ao obter URL de pagamento do Mercado Pago.');
        }

    } catch (error) {
        console.error('Erro ao iniciar pagamento:', error);
        alert('Não foi possível iniciar o pagamento. Tente novamente mais tarde.');
    }
});


// --- 4.2. Lógica para Carregar o Histórico de Pagamentos ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid; // Armazena o ID do usuário logado
        console.log("Usuário autenticado em Zafyre Pay:", currentUserId);
        fetchTransactionHistory(currentUserId);
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando para login...");
        window.location.href = '/';
    }
});

function fetchTransactionHistory(userId) {
    // Consulta a coleção 'transactions' (você precisará criar esta coleção e registrar os pagamentos nela)
    const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId), // Filtra as transações pelo ID do usuário
        orderBy("timestamp", "desc") // Ordena pelas mais recentes
    );

    onSnapshot(q, (snapshot) => {
        transactionsList.innerHTML = ''; // Limpa a lista existente
        loadingMessage.classList.add('hidden');

        if (snapshot.empty) {
            noTransactionsMessage.classList.remove('hidden');
            return;
        }

        noTransactionsMessage.classList.add('hidden');

        snapshot.forEach((doc) => {
            const transaction = doc.data();
            const transactionItem = document.createElement('div');
            // Adiciona classe de status para cores diferentes
            let statusClass = '';
            let statusText = '';
            switch (transaction.status) {
                case 'approved':
                    statusClass = 'success';
                    statusText = 'Concluído';
                    break;
                case 'pending':
                    statusClass = 'pending';
                    statusText = 'Pendente';
                    break;
                case 'rejected':
                case 'cancelled':
                    statusClass = 'failure';
                    statusText = 'Falhou';
                    break;
                default:
                    statusClass = '';
                    statusText = 'Desconhecido';
            }
            transactionItem.classList.add('transaction-item', statusClass);

            const transactionDate = transaction.timestamp ? new Date(transaction.timestamp.toDate()).toLocaleDateString('pt-BR') : 'N/A';
            const transactionAmount = transaction.amount ? `R$ ${transaction.amount.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
            const transactionTitle = transaction.title || 'Transação';

            transactionItem.innerHTML = `
                <div class="transaction-details">
                    <span class="transaction-title">${transactionTitle}</span>
                    <span class="transaction-date">${transactionDate}</span>
                </div>
                <div class="transaction-amount-status">
                    <span class="transaction-amount">${transactionAmount}</span>
                    <span class="transaction-status">${statusText}</span>
                </div>
            `;
            transactionsList.appendChild(transactionItem);
        });
    }, (error) => {
        console.error("Erro ao buscar histórico de transações:", error);
        transactionsList.innerHTML = '<p class="error-message">Erro ao carregar histórico de transações.</p>';
        loadingMessage.classList.add('hidden');
    });
}

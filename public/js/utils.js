// public/js/utils.js

/**
 * Formata um número como moeda (Real Brasileiro).
 * @param {number} value O valor numérico a ser formatado.
 * @returns {string} O valor formatado como "R$ X.XXX,XX".
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Converte um valor em ZafyreCoins para Reais.
 * 1 ZafyreCoin = R$ 0,05.
 * @param {number} zafyreCoins O valor em ZafyreCoins.
 * @returns {number} O valor equivalente em Reais.
 */
export function zafyreCoinsToBRL(zafyreCoins) {
    const rate = 0.05; // 1 ZafyreCoin = R$ 0,05
    return zafyreCoins * rate;
}

/**
 * Converte um valor em Reais para ZafyreCoins.
 * 1 ZafyreCoin = R$ 0,05.
 * @param {number} brlValue O valor em Reais.
 * @returns {number} O valor equivalente em ZafyreCoins.
 */
export function brlToZafyreCoins(brlValue) {
    const rate = 0.05; // 1 ZafyreCoin = R$ 0,05
    return brlValue / rate;
}

/**
 * Função para mostrar uma mensagem de status temporária.
 * @param {HTMLElement} element O elemento onde a mensagem será exibida.
 * @param {string} message A mensagem a ser exibida.
 * @param {string} type O tipo de mensagem ('success' ou 'error').
 * @param {number} duration A duração em milissegundos para a mensagem desaparecer.
 */
export function showStatusMessage(element, message, type, duration = 3000) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'status-message';
    }, duration);
}

/**
 * Função para formatar uma data para exibição amigável.
 * @param {firebase.firestore.Timestamp} timestamp O timestamp do Firestore.
 * @returns {string} Data formatada.
 */
export function formatDate(timestamp) {
    if (!timestamp) return 'Data Indisponível';
    const date = timestamp.toDate(); // Converte o Timestamp do Firestore para objeto Date
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 1) return "agora mesmo";
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffHours < 24) return `${diffHours} horas atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

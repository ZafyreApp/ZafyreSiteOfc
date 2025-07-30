// public/js/ui.js

/**
 * Abre um modal.
 * @param {HTMLElement} modalElement O elemento do modal a ser aberto.
 */
export function openModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'block';
        // Adiciona classe para desativar scroll no body, se houver CSS para isso
        document.body.classList.add('modal-open');
    }
}

/**
 * Fecha um modal.
 * @param {HTMLElement} modalElement O elemento do modal a ser fechado.
 */
export function closeModal(modalElement) {
    if (modalElement) {
        modalElement.style.display = 'none';
        // Remove classe para reativar scroll no body
        document.body.classList.remove('modal-open');
    }
}

/**
 * Configura botões de fechar e clique fora para um modal.
 * @param {HTMLElement} modalElement O elemento do modal.
 * @param {string} closeButtonClass A classe CSS dos botões de fechar dentro do modal.
 */
export function setupModal(modalElement, closeButtonClass = 'close-button') {
    if (!modalElement) return;

    const closeButtons = modalElement.querySelectorAll(`.${closeButtonClass}`);
    closeButtons.forEach(button => {
        button.addEventListener('click', () => closeModal(modalElement));
    });

    // Fecha o modal ao clicar fora do conteúdo
    window.addEventListener('click', (event) => {
        if (event.target === modalElement) {
            closeModal(modalElement);
        }
    });
}

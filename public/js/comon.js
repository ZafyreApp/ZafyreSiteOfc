// Dentro de public/js/common.js, ou um novo global.js
import { logoutUser } from './firebase-auth.js'; // Importe a função de logout

document.addEventListener('DOMContentLoaded', () => {
    // ... (seu código common.js existente)

    // Adiciona listener para o botão de logout na sidebar
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
            } catch (error) {
                alert('Erro ao deslogar: ' + error.message);
            }
        });
    }

    // Adiciona listener para o botão de logout na mobile nav
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    if (logoutButtonMobile) {
        logoutButtonMobile.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
            } catch (error) {
                alert('Erro ao deslogar: ' + error.message);
            }
        });
    }

    // ... (resto do seu código common.js)
});

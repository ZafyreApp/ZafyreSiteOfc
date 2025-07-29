
// public/js/layout-base.js

// Função para marcar o item ativo na sidebar
function setActiveNavItem(pageId) {
    // Remove active de todos os itens
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adiciona active ao item atual
    const activeItem = document.getElementById(`nav-${pageId}`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Função para definir o título da página
function setPageTitle(title) {
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = title;
    }
    document.title = `${title} - Zafyre`;
}

// Detectar página atual e marcar como ativa
function initializeNavigation() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'feed';
    
    // Mapear nomes de páginas para IDs de navegação
    const pageMap = {
        'feed': 'feed',
        'my-profile': 'profile',
        'user-profile': 'profile',
        'chat': 'chat',
        'notifications': 'notifications',
        'zafyre-pay': 'pay',
        'zafyre-shop': 'shop',
        'subscriptions': 'subscriptions'
    };
    
    const navId = pageMap[currentPage] || 'feed';
    setActiveNavItem(navId);
    
    // Definir títulos específicos para cada página
    const pageTitles = {
        'feed': 'Feed',
        'my-profile': 'Meu Perfil',
        'user-profile': 'Perfil',
        'chat': 'Chat',
        'notifications': 'Notificações',
        'zafyre-pay': 'Zafyre Pay',
        'zafyre-shop': 'Zafyre Shop',
        'subscriptions': 'Assinaturas'
    };
    
    const pageTitle = pageTitles[currentPage] || 'Zafyre';
    setPageTitle(pageTitle);
}

// Função de logout
async function handleLogout() {
    try {
        const { signOut } = await import('./firebase-init.js');
        const { auth } = await import('./firebase-init.js');
        
        await signOut(auth);
        console.log('Usuário deslogado com sucesso');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao sair. Tente novamente.');
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    
    // Configurar botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Exportar funções para uso em outras páginas
window.ZafyreLayout = {
    setActiveNavItem,
    setPageTitle,
    initializeNavigation,
    handleLogout
};

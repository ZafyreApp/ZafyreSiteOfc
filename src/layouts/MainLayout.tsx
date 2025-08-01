// src/layouts/MainLayout.tsx
import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';

// Importe os ícones que você usará (ex: de uma biblioteca como 'react-icons' ou SVG customizados)
// Por enquanto, usaremos texto ou emojis. Você pode substituir por ícones reais.

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // Pega o usuário autenticado
  const { userProfile, loading: userProfileLoading } = useUser(); // Pega o perfil completo do usuário
  const router = useRouter();

  const isLoading = authLoading || userProfileLoading;

  // Define os itens da navegação
  const navItems = [
    { name: 'Feed', icon: '🏠', path: '/feed' },
    { name: 'Perfil', icon: '👤', path: user ? `/profile/${user.uid}` : '/profile/guest' }, // Rota dinâmica para o perfil
    { name: 'Chat', icon: '✉️', path: '/chat' },
    { name: 'Notificações', icon: '🔔', path: '/notifications' },
    { name: 'Zafyre Pay', icon: '💰', path: '/zafyre-pay' }, // Se for uma página separada
    { name: 'Zafyre Shop', icon: '🛍️', path: '/shop' },
    // Item condicional baseado no tipo de usuário
    userProfile?.isCreator
      ? { name: 'Zafyre Creators', icon: '🌟', path: '/creator/dashboard' }
      : { name: 'Assinaturas', icon: '🤝', path: '/subscriptions' },
  ];

  if (isLoading) {
    // Pode mostrar um loader completo aqui enquanto carrega
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregando... {/* Substitua por um LoadingSpinner */}
      </div>
    );
  }

  // Se não estiver logado, não exibe o layout principal, apenas o conteúdo da página inicial.
  // Você pode ajustar essa lógica se quiser que certas páginas sejam acessíveis sem login.
  if (!user && router.pathname !== '/' && !router.pathname.startsWith('/auth')) {
    router.push('/'); // Redireciona para a tela inicial se não estiver logado e não for página de auth
    return null; // Não renderiza nada enquanto redireciona
  }

  return (
    <div className="main-layout">
      {user && ( // Só mostra a navegação se o usuário estiver logado
        <nav className="fixed-navbar">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.name} className={`nav-item ${router.pathname === item.path ? 'active' : ''}`}>
                <Link href={item.path}>
                  <div className="nav-link-content">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-name">{item.name}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <main className={`content-area ${user ? 'with-navbar' : ''}`}>
        {children}
      </main>

      <style jsx>{`
        .main-layout {
          display: flex;
          min-height: 100vh;
          flex-direction: column; /* Para mobile, navbar superior */
        }
        .fixed-navbar {
          background-color: #000; /* Fundo escuro para a navbar */
          color: var(--text-light);
          padding: 20px 0;
          width: 250px; /* Largura padrão */
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
        }
        .nav-item {
          width: 100%;
          margin-bottom: 10px;
        }
        .nav-item a {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          color: var(--text-light);
          font-size: 1.1em;
          transition: background-color 0.3s ease;
        }
        .nav-item a:hover, .nav-item.active a {
          background-color: rgba(255, 193, 7, 0.2); /* Fundo dourado suave */
          color: var(--primary-gold);
        }
        .nav-icon {
          margin-right: 15px;
          font-size: 1.5em; /* Aumenta o tamanho do ícone */
        }
        .nav-link-content {
          display: flex;
          align-items: center;
        }

        .content-area {
          flex-grow: 1;
          padding: 20px;
          transition: margin-left 0.3s ease;
        }
        .content-area.with-navbar {
          margin-left: 250px; /* Espaço para a navbar fixa */
        }

        /* Comportamento Responsivo: em telas pequenas, vira barra superior */
        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column;
          }
          .fixed-navbar {
            width: 100%;
            height: auto;
            position: sticky; /* ou 'fixed' no topo */
            top: 0;
            left: 0;
            right: 0;
            flex-direction: row;
            justify-content: space-around;
            padding: 10px 0;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          }
          .nav-list {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
          }
          .nav-item {
            margin-bottom: 0;
            flex: 1; /* Distribui os itens igualmente */
            text-align: center;
          }
          .nav-item a {
            flex-direction: column; /* Ícone e texto um em cima do outro */
            padding: 5px 10px;
            font-size: 0.8em; /* Ajusta fonte para telas menores */
          }
          .nav-icon {
            margin-right: 0;
            margin-bottom: 5px; /* Espaço entre ícone e texto */
            font-size: 1.2em;
          }
          .nav-name {
            display: block; /* Garante que o nome apareça abaixo do ícone */
          }
          .content-area.with-navbar {
            margin-left: 0; /* Remove a margem esquerda para telas pequenas */
            padding-top: 20px; /* Ajuste se a navbar superior for fixa */
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;

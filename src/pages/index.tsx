// src/pages/index.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Button from '../components/ui/Button'; // Componente de botão genérico

const HomePage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { loginWithGoogle, loading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // O redirecionamento é tratado no AuthContext
    } catch (error) {
      alert(`Erro ao logar com Google: ${error}`);
    }
  };

  return (
    <div className="home-page-container">
      <Head>
        <title>Zafyre - Conecte-se e Explore</title>
        <meta name="description" content="Bem-vindo ao Zafyre!" />
      </Head>

      <div className="logo-section">
        <img src="/images/logo.png" alt="Zafyre Logo" className="zafyre-logo" />
        <h1>Bem-vindo ao Zafyre!</h1>
      </div>

      <div className="auth-forms-container">
        {isLoginMode ? (
          <LoginForm />
        ) : (
          <RegisterForm onRegisterSuccess={() => setIsLoginMode(true)} />
        )}

        <div className="toggle-mode-section">
          <p>
            {isLoginMode ? "Não tem uma conta?" : "Já tem uma conta?"}{' '}
            <a onClick={() => setIsLoginMode(!isLoginMode)} className="toggle-link">
              {isLoginMode ? "Crie uma agora!" : "Fazer login"}
            </a>
          </p>
          <div className="separator">
            <span>OU</span>
          </div>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-button"
          >
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .home-page-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: var(--background-dark);
          color: var(--text-light);
          padding: 20px;
        }
        .logo-section {
          text-align: center;
          margin-bottom: 40px;
        }
        .zafyre-logo {
          width: 150px;
          height: auto;
          margin-bottom: 20px;
        }
        h1 {
          color: var(--primary-gold);
          font-size: 2.5em;
          margin-bottom: 0;
        }
        .auth-forms-container {
          background-color: #2a2a2a;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        .toggle-mode-section {
          margin-top: 20px;
          border-top: 1px solid var(--border-gray);
          padding-top: 20px;
        }
        .toggle-link {
          color: var(--primary-gold);
          cursor: pointer;
          font-weight: bold;
        }
        .toggle-link:hover {
          text-decoration: underline;
        }
        .separator {
          position: relative;
          margin: 20px 0;
          text-align: center;
        }
        .separator span {
          background: #2a2a2a;
          padding: 0 10px;
          position: relative;
          z-index: 1;
        }
        .separator::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--border-gray);
          z-index: 0;
        }
        .google-button {
          background-color: #4285F4; /* Cor do Google */
          color: white;
          width: 100%;
          padding: 12px;
          border-radius: 5px;
          font-size: 1.1em;
          margin-top: 10px;
          transition: background-color 0.3s ease;
        }
        .google-button:hover {
          background-color: #357ae8;
        }
        .google-button:disabled {
          background-color: #6a6a6a;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default HomePage;

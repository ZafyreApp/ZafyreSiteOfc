// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      // Redirecionamento é tratado no AuthContext
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Entrar</h2>
      {error && <p className="error-message">{error}</p>}
      <Input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
      <style jsx>{`
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        h2 {
          color: var(--primary-gold);
          text-align: center;
          margin-bottom: 20px;
        }
        .error-message {
          color: var(--error-red);
          text-align: center;
          font-size: 0.9em;
        }
      `}</style>
    </form>
  );
};

export default LoginForm;

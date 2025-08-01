// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      await register(email, password, isCreator);
      onRegisterSuccess(); // Notifica o componente pai que o registro foi um sucesso
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Criar Conta</h2>
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
      <Input
        type="password"
        placeholder="Confirme a Senha"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <div className="checkbox-group">
        <input
          type="checkbox"
          id="isCreator"
          checked={isCreator}
          onChange={(e) => setIsCreator(e.target.checked)}
        />
        <label htmlFor="isCreator">Sou uma Criadora Zafyre</label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Criar Conta'}
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
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        .checkbox-group label {
          font-size: 0.9em;
          color: var(--text-light);
        }
      `}</style>
    </form>
  );
};

export default RegisterForm;

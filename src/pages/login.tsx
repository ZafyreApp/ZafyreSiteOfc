import { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      alert('Erro ao entrar');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      alert('Erro ao entrar com Google');
    }
  };

  return (
    <main className="bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-4">Entrar</h1>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 px-4 py-2 rounded bg-zinc-800 text-white"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 px-4 py-2 rounded bg-zinc-800 text-white"
      />
      <button onClick={handleLogin} className="bg-yellow-500 px-6 py-2 rounded text-black font-bold mb-2">
        Entrar
      </button>
      <button onClick={handleGoogleLogin} className="bg-yellow-700 px-6 py-2 rounded text-white font-bold">
        Entrar com Google
      </button>
    </main>
  );
}

import { useAuth } from '../services/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  if (!user) return null;

  return (
    <main className="bg-zinc-900 text-white min-h-screen p-6">
      <h1 className="text-2xl mb-4">Bem-vindo, {user.displayName || user.email}</h1>
      <button onClick={logout} className="bg-red-500 px-4 py-2 rounded text-white">
        Sair
      </button>
    </main>
  );
}

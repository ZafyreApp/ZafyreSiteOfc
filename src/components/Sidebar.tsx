import Link from 'next/link';
import { useAuth } from '../services/AuthContext';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { icon: '🏠', label: 'Feed', href: '/feed' },
    { icon: '👤', label: 'Perfil', href: '/perfil' },
    { icon: '✉️', label: 'Chat', href: '/chat' },
    { icon: '🔔', label: 'Notificações', href: '/notificacoes' },
    { icon: '💰', label: 'Zafyre Pay', href: '/carteira' },
    { icon: '💰', label: 'Zafyre Shop', href: '/shop' },
    { icon: '👤', label: user?.displayName?.includes('Criadora') ? 'Zafyre Creators' : 'Assinaturas', href: '/assinaturas' },
  ];

  return (
    <nav className={`bg-zinc-800 text-white ${isMobile ? 'flex justify-around py-2' : 'fixed top-0 left-0 h-full w-20 flex flex-col items-center pt-6'}`}>
      {navItems.map((item) => (
        <Link key={item.label} href={item.href}>
          <div className="text-2xl mb-6 hover:text-yellow-500 cursor-pointer" title={item.label}>
            {item.icon}
          </div>
        </Link>
      ))}
    </nav>
  );
}

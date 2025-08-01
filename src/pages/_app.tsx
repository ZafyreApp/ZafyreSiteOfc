// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import MainLayout from '../layouts/MainLayout'; // O layout com a navegação fixa
import '../styles/globals.css'; // Importe seus estilos globais

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <UserProvider>
        <MainLayout> {/* Seu layout principal que inclui a navegação */}
          <Component {...pageProps} />
        </MainLayout>
      </UserProvider>
    </AuthProvider>
  );
}

export default MyApp;

// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../config/firebase'; // Importa a instância do Firebase
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Importa Firestore para dados do usuário
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, isCreator: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // Opcional: Redirecionar após login/logout
      if (currentUser && router.pathname === '/') {
        router.push('/feed'); // Redireciona para o feed após login
      } else if (!currentUser && router.pathname !== '/') {
        // router.push('/'); // Redireciona para login se deslogar e não estiver na tela inicial
      }
    });

    return () => unsubscribe();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Erro ao fazer login:", error.message);
      throw new Error(error.message); // Propaga o erro para o componente que chamou
    }
  };

  const register = async (email: string, password: string, isCreator: boolean) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Cria um documento de usuário no Firestore para armazenar informações adicionais
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        isCreator: isCreator,
        name: userCredential.user.displayName || email.split('@')[0], // Nome padrão ou do Google
        avatarUrl: process.env.NEXT_PUBLIC_DEFAULT_AVATAR_URL || '/images/default-avatar.png', // Avatar padrão
        bio: "",
        followersCount: 0,
        likesCount: 0,
        // Campos específicos de criador/usuário podem ser adicionados aqui ou em um sub-coleção
        zafyreCoins: 0,
        isPremium: false,
        premiumPlan: null,
        // ...outros campos relevantes
      });
    } catch (error: any) {
      console.error("Erro ao criar conta:", error.message);
      throw new Error(error.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // Se o usuário Google não existe no Firestore, cria um novo perfil padrão
        await setDoc(userRef, {
          email: result.user.email,
          isCreator: false, // Define como usuário normal por padrão para Google login
          name: result.user.displayName || result.user.email?.split('@')[0],
          avatarUrl: result.user.photoURL || process.env.NEXT_PUBLIC_DEFAULT_AVATAR_URL || '/images/default-avatar.png',
          bio: "",
          followersCount: 0,
          likesCount: 0,
          zafyreCoins: 0,
          isPremium: false,
          premiumPlan: null,
        });
      }
    } catch (error: any) {
      console.error("Erro ao fazer login com Google:", error.message);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redireciona para a tela inicial após o logout
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error.message);
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

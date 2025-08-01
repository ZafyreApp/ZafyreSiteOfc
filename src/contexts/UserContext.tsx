// src/contexts/UserContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth'; // Usa o hook de autenticação

// Definição de um tipo para o perfil do usuário
export interface UserProfile {
  uid: string;
  email: string;
  isCreator: boolean;
  name: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  likesCount: number;
  zafyreCoins: number;
  isPremium: boolean;
  premiumPlan: string | null;
  inviteCode?: string; // Apenas para criadores
  invitedCreators?: { uid: string; email: string; revenue: number }[]; // Apenas para criadores
  // ...outros campos que você definir no Firestore
}

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user } = useAuth(); // Obtém o usuário do contexto de autenticação
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    if (user) {
      setLoading(true);
      const userDocRef = doc(db, "users", user.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
        } else {
          setUserProfile(null);
          console.warn("User profile not found in Firestore for UID:", user.uid);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      });
    } else {
      setUserProfile(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe(); // Limpa o listener do Firestore ao desmontar ou mudar de usuário
      }
    };
  }, [user]);

  return (
    <UserContext.Provider value={{ userProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

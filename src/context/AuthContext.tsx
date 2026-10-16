import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase.ts';

export interface SavedStrategyRecord {
  id: string;
  name: string;
  symbol: string;
  learningRate: number;
  discountFactor: number;
  rewardStrategy: string;
  totalEpisodesTrained: number;
  finalReturnPct: number;
  winRate: number;
  qTableSize: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => Promise<void>;
  savedStrategies: SavedStrategyRecord[];
  saveStrategy: (strategy: Omit<SavedStrategyRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteStrategy: (strategyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategyRecord[]>([]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync or initialize user profile in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'EGX Algorithmic Trader',
              email: currentUser.email || '',
              riskTolerance: 'moderate',
              defaultStock: 'COMI',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setWatchlist([]);
        setSavedStrategies([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to user's watchlist subcollection
  useEffect(() => {
    if (!user) return;

    const watchlistRef = collection(db, 'users', user.uid, 'watchlist');
    const unsubscribe = onSnapshot(
      watchlistRef,
      (snapshot) => {
        const symbols = snapshot.docs.map((d) => d.id);
        setWatchlist(symbols);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/watchlist`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to user's saved strategies subcollection
  useEffect(() => {
    if (!user) return;

    const strategiesRef = collection(db, 'users', user.uid, 'savedStrategies');
    const unsubscribe = onSnapshot(
      strategiesRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => d.data() as SavedStrategyRecord);
        setSavedStrategies(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/savedStrategies`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err?.message);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err?.message);
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    const cleanSymbol = symbol.replace('.CA', '');
    const itemRef = doc(db, 'users', user.uid, 'watchlist', cleanSymbol);

    try {
      if (watchlist.includes(cleanSymbol)) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, {
          symbol: cleanSymbol,
          notes: 'Tracked for algorithmic RL signals',
          addedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/watchlist/${cleanSymbol}`);
    }
  };

  const saveStrategy = async (strategy: Omit<SavedStrategyRecord, 'id' | 'createdAt'>) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    const id = `strat_${Date.now()}`;
    const stratRef = doc(db, 'users', user.uid, 'savedStrategies', id);

    const record: SavedStrategyRecord = {
      ...strategy,
      id,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(stratRef, record);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/savedStrategies/${id}`);
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    if (!user) return;
    const stratRef = doc(db, 'users', user.uid, 'savedStrategies', strategyId);
    try {
      await deleteDoc(stratRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savedStrategies/${strategyId}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        watchlist,
        toggleWatchlist,
        savedStrategies,
        saveStrategy,
        deleteStrategy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

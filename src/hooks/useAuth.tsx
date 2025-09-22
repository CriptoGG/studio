
"use client";

import {
    createContext,
    useState,
    useEffect,
    useContext,
    ReactNode,
} from 'react';
import {
    onAuthStateChanged,
    User,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: typeof createUserWithEmailAndPassword;
    signIn: typeof signInWithEmailAndPassword;
    signInWithGoogle: () => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            throw error;
        }
    };
    
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            toast({ title: 'Signed Out', description: 'You have been successfully signed out.' });
        } catch (error) {
            console.error("Error signing out: ", error);
            toast({ title: 'Sign Out Error', description: 'Could not sign you out. Please try again.', variant: 'destructive' });
        }
    };

    const value = {
        user,
        loading,
        signUp: createUserWithEmailAndPassword.bind(null, auth),
        signIn: signInWithEmailAndPassword.bind(null, auth),
        signInWithGoogle,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// This hook can be used to fetch user-specific data from Firestore
export function useUserQuery<T>(key: string, fetcher: (uid: string) => Promise<T>) {
    const { user } = useAuth();
    return useQuery({
        queryKey: [key, user?.uid],
        queryFn: () => {
            if (!user?.uid) throw new Error("User is not authenticated");
            return fetcher(user.uid);
        },
        enabled: !!user,
    });
}

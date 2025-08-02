'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
// ## 1. Impor yang Diperlukan dari Firestore
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore'; 
import { auth, db } from '@/lib/firebase';
// Tipe UserProfile tidak perlu diimpor dari auth.ts lagi jika didefinisikan di sini
// import { getUserProfile, UserProfile } from '@/lib/auth';

// Definisikan tipe UserProfile di sini agar lebih rapi
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  exp: number;
  level: number;
  // tambahkan properti lain jika ada
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ## 2. Ganti logika useEffect menjadi real-time
    let profileListenerUnsubscribe: Unsubscribe | undefined;

    const authStateUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Hentikan listener profil sebelumnya jika ada (misal saat user logout)
      if (profileListenerUnsubscribe) {
        profileListenerUnsubscribe();
      }

      if (user) {
        // Jika pengguna login, buat listener BARU ke dokumen profil mereka
        const userDocRef = doc(db, 'users', user.uid);
        
        profileListenerUnsubscribe = onSnapshot(userDocRef, 
          (doc) => {
            if (doc.exists()) {
              // Setiap kali data di Firestore berubah, state 'profile' akan di-update
              setProfile({ uid: doc.id, ...doc.data() } as UserProfile);
            } else {
              // Kasus jika user terdaftar di Auth tapi tidak ada profil di Firestore
              console.error("User profile not found in Firestore.");
              setProfile(null);
            }
            setUser(user);
            setLoading(false);
          }, 
          (error) => {
            // Tangani error saat mendengarkan data
            console.error("Error listening to user profile:", error);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        );

      } else {
        // Jika pengguna logout, set semua state ke null
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // ## 3. Fungsi pembersihan (cleanup)
    // Ini akan berjalan saat komponen AuthProvider tidak lagi digunakan
    return () => {
      authStateUnsubscribe(); // Hentikan listener status otentikasi
      if (profileListenerUnsubscribe) {
        profileListenerUnsubscribe(); // Hentikan listener profil
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
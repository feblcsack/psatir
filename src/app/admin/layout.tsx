'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
// Impor Link dan ikon tidak lagi diperlukan di file ini karena navigasi sidebar dihapus
// import Link from 'next/link';
// import { Home, CheckSquare, QrCode, Users, FileText, Settings, BarChart3 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (profile?.role !== 'admin') {
        router.push('/user');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  // Variabel navigasi tidak lagi diperlukan karena sidebar telah dihapus
  // const navigation = [ ... ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Kontainer flex dan elemen <aside> telah dihapus */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
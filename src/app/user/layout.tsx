'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Home, CheckSquare, QrCode, User, Trophy, Clock } from 'lucide-react';

export default function UserLayout({
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
      } else if (profile?.role !== 'user') {
        router.push('/admin');
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

  if (!user || profile?.role !== 'user') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/user', icon: Home },
    { name: 'Available Tasks', href: '/user/tasks', icon: CheckSquare },
    { name: 'Check-in', href: '/user/checkin', icon: QrCode },
    { name: 'Leaderboard', href: '/user/leaderboard', icon: Trophy },
    { name: 'History', href: '/user/history', icon: Clock },
    { name: 'Profile', href: '/user/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="mt-5 px-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 mb-1"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

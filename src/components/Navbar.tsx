'use client';

import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout berhasil!');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Logout gagal!');
    }
  };

  if (!profile) return null;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-indigo-600">Psatir</h1>
            <div className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              {profile.role === 'admin' ? 'Admin Panel' : 'User Dashboard'}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">{profile.name}</span>
              </div>
              
              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 rounded-full">
                <Star className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-800 text-sm font-medium">
                  Level {profile.level}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-600">{profile.exp} EXP</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
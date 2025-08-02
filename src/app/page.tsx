'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center items-center min-h-screen text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span className="text-indigo-600">Psatir</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Gamified task management system with QR check-in functionality. 
            Complete tasks, earn experience, and level up!
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Login
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/auth/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Register
              </Link>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 text-3xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900">Task Management</h3>
              <p className="mt-2 text-gray-500">Complete tasks and earn experience points</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 text-3xl mb-4">📱</div>
              <h3 className="text-lg font-medium text-gray-900">QR Check-in</h3>
              <p className="mt-2 text-gray-500">Daily check-in with QR code scanning</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-indigo-600 text-3xl mb-4">🏆</div>
              <h3 className="text-lg font-medium text-gray-900">Gamification</h3>
              <p className="mt-2 text-gray-500">Level up and compete on leaderboards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
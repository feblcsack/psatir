'use client';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, Star, Menu, X, Home, CheckSquare, QrCode, Trophy, Clock, Users, FileText, Settings, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation untuk user
  const userNavigation = [
    { name: 'Dashboard', href: '/user', icon: Home },
    { name: 'Tasks', href: '/user/tasks', icon: CheckSquare },
    { name: 'Check-in', href: '/user/checkin', icon: QrCode },
    { name: 'Leaderboard', href: '/user/leaderboard', icon: Trophy },
    { name: 'History', href: '/user/history', icon: Clock },
    { name: 'Profile', href: '/user/profile', icon: User },
  ];

  // Navigation untuk admin
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Manage Tasks', href: '/admin/tasks', icon: CheckSquare },
    { name: 'Submissions', href: '/admin/submissions', icon: FileText },
    { name: 'Generate QR', href: '/admin/qr', icon: QrCode },
  ];

  // Pilih navigation berdasarkan role
  const navigation = profile?.role === 'admin' ? adminNavigation : userNavigation;

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Psatir</h1>
              </Link>
             
              {/* Role badge */}
              {profile?.role === 'admin' && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Admin
                </span>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Stats - Only show for regular users */}
            {profile?.role !== 'admin' && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full">
                  <span className="text-sm font-medium text-gray-700">{profile.name}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">Lv.{profile.level}</span>
                  </div>
                  <span className="text-xs text-gray-500">{profile.exp} EXP</span>
                </div>
              </div>
            )}

            {/* Admin Info - Only show for admin */}
            {profile?.role === 'admin' && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
                  <User className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">{profile.name}</span>
                  <span className="text-xs text-red-600 font-medium">Administrator</span>
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Logout button - Desktop */}
            <button
              onClick={handleSignOut}
              className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* User info on mobile */}
              <div className={`px-3 py-2 mb-2 rounded-md ${
                profile?.role === 'admin' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {profile?.role === 'admin' && <User className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium text-gray-900">{profile.name}</span>
                    {profile?.role === 'admin' && (
                      <span className="text-xs text-red-600 font-medium">Admin</span>
                    )}
                  </div>
                  {profile?.role !== 'admin' && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Level {profile.level}</span>
                      </div>
                      <span className="text-xs text-gray-500">{profile.exp} EXP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation items */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'text-gray-900 bg-gray-100'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Logout button - Mobile */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
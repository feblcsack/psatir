'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, BookMarked } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const { profile } = await signIn(email, password);
      toast.success('Login berhasil!');
     
      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (error: any) {
      setError(error.message || 'Login gagal!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-lg shadow-blue-200/50 border border-white/20">
              <BookMarked className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-800">
            Welcome back!
          </h1>
          <p className="text-slate-600 mt-2 font-medium">Login ke Psatir</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-100/30 rounded-2xl overflow-hidden">
          {/* Card Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <h2 className="text-xl font-bold text-center text-slate-800">Sign in to your account</h2>
            <p className="text-center text-sm text-slate-600 mt-2 font-medium">
              Enter your credentials below
            </p>
          </div>
          
          {/* Card Content */}
          <div className="px-8 py-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    id="email"
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none  text-slate-800 placeholder-slate-500 transition-all duration-200 font-medium"
                    required 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none  text-slate-800 placeholder-slate-500 transition-all duration-200 font-medium"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-100"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors font-semibold"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full py-2 font-semibold text-slate-900 border border-slate-400
                 disabled:cursor-not-allowed rounded-sm transition-all duration-200 focus:outline-none transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-6 border-t border-blue-100">
              <p className="text-sm text-slate-600 font-medium">
                Don't have an account?{' '}
                <Link 
                  href="/auth/register" 
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 rounded-full border border-white/40 shadow-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-slate-600 font-medium">
              Secure login protected by encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
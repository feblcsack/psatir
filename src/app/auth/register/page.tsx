'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, BookMarked, GraduationCap, Shield } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.password) {
      setError("Semua field wajib diisi.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    try {
      const { profile } = await signUp(formData.email, formData.password, formData.name, formData.role);
      toast.success('Registrasi berhasil!');
      
      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    } catch (error: any) {
      setError(error.message || 'Registrasi gagal!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <BookMarked className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join with us!</h1>
          <p className="text-gray-600 mt-2">Register ke Psatir</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-lg overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 space-y-1 pb-4">
            <h2 className="text-xl font-semibold text-center text-gray-900">Make an account</h2>
            <p className="text-center text-sm text-gray-600">
              Please fill the field below
            </p>
          </div>
          
          {/* Card Content */}
          <div className="px-6 pb-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input 
                    id="name"
                    type="text"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 h-11 border border-gray-300 rounded-md focus:outline-none bg-white text-slate-700"
                    required 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input 
                    id="email"
                    type="email" 
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 h-11 border border-gray-300 rounded-md focus:outline-none text-slate-700 bg-white"
                    required 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (minimal 6 karakter)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 h-11 border border-gray-300 rounded-md focus:outline-none text-slate-700 bg-white"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* User Option */}
                  <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      id="user"
                      name="role"
                      value="user"
                      checked={formData.role === 'user'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <label htmlFor="user" className="text-sm font-medium text-gray-700 cursor-pointer">
                        User
                      </label>
                    </div>
                  </div>
                  
                  {/* Admin Option */}
                  <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      id="admin"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <label htmlFor="admin" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Admin
                      </label>
                    </div>
                  </div>
                </div>
                
                {formData.role === 'admin' && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                    💡 As an admin, you will have full access to manage the system!
                  </p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full h-11 font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? "Hold on..." : "Create Account"}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
                >
                  Login di sini
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Terms */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Dengan mendaftar, Anda menyetujui{' '}
          <Link href="/terms" className="underline hover:text-gray-700 transition-colors">
            Syarat & Ketentuan
          </Link>{' '}
          dan{' '}
          <Link href="/privacy" className="underline hover:text-gray-700 transition-colors">
            Kebijakan Privasi
          </Link>
        </p>
      </div>
    </div>
  );
}
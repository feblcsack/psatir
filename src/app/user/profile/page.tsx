'use client';

import { useAuth } from '@/context/AuthContext';
import { User, Mail, Hash, Trophy } from 'lucide-react';
import Image from 'next/image'; // Impor komponen Image dari Next.js

// Komponen untuk Tampilan Loading (Skeleton)
const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
    <div className="h-10 bg-slate-200 rounded w-1/3"></div>
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-slate-200 rounded-full"></div>
          <div className="space-y-3">
            <div className="h-8 bg-slate-300 rounded w-48"></div>
            <div className="h-5 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-16"></div><div className="h-5 bg-slate-200 rounded w-40"></div></div>
          <div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-16"></div><div className="h-5 bg-slate-200 rounded w-24"></div></div>
          <div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-16"></div><div className="h-5 bg-slate-200 rounded w-32"></div></div>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-8 h-32"></div>
  </div>
);

export default function UserProfile() {
  const { profile } = useAuth();

  if (!profile) {
    return <ProfileSkeleton />;
  }
  
  const progressPercentage = profile.exp % 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-3xl font-medium text-slate-800">My Profile</h1>
        <p className="mt-2 text-slate-500">View your account information and progress.</p>
      </div>

      {/* Panel Profil Utama */}
      <div className="bg-white rounded-xl border border-slate-200/80">
        
        {/* Bagian Atas: Avatar dan Nama */}
        <div className="p-8">
          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24">
              {/* ## PERUBAHAN DI SINI: Menggunakan gambar lokal */}
              <Image
                // Arahkan 'src' ke gambar Anda di folder /public
                src="/wahyu.png" 
                alt="User Avatar"
                width={96}
                height={96}
                className="rounded-full object-cover border-2 border-white shadow-sm"
                priority
              />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">{profile.name}</h2>
              <p className="text-slate-500 mt-1">Level {profile.level} • {profile.exp} Total EXP</p>
            </div>
          </div>
        </div>
        
        {/* Bagian Tengah: Detail Informasi */}
        <div className="border-t border-slate-100 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
            {/* Info Email */}
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="mt-0.5 font-medium text-slate-800 break-all">{profile.email}</dd>
              </div>
            </div>
            {/* Info User ID */}
            <div className="flex items-start space-x-3">
              <Hash className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <dt className="text-sm text-slate-500">User ID</dt>
                <dd className="mt-0.5 font-mono text-xs font-medium text-slate-800 break-all">{profile.uid}</dd>
              </div>
            </div>
            {/* Info Role */}
            <div className="flex items-start space-x-3">
              <Trophy className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <dt className="text-sm text-slate-500">Role</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Panel Progress Level */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-8">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-slate-800">Progress to Next Level</h3>
            <span className="text-sm font-semibold text-slate-500">{profile.exp % 100} / 100 EXP</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div 
            className="bg-slate-800 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm mt-2">
            <span className="font-medium text-slate-500">Level {profile.level}</span>
            <span className="font-medium text-slate-400">Next: Level {profile.level + 1}</span>
        </div>
      </div>
    </div>
  );
}
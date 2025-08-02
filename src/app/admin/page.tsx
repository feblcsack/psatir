'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getTasks, getTaskSubmissions } from '@/lib/tasks';
import { getTotalUsers } from '@/lib/auth';
import { getTodayCheckInCount } from '@/lib/qrService';
import { CheckSquare, Users, FileText, TrendingUp, QrCode, Plus } from 'lucide-react';
import Link from 'next/link';

// Komponen untuk Tampilan Loading
const DashboardSkeleton = () => (
  <div>
    <div className="mb-8 h-16 bg-slate-200 rounded-lg animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 h-32 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-slate-300 rounded w-1/4"></div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl p-6 h-48 animate-pulse"></div>
  </div>
);

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingSubmissions: 0,
    totalUsers: 0,
    todayCheckIns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!profile) return;
      
      try {
        // Jalankan semua pengambilan data secara paralel untuk performa lebih baik
        const [
          tasks, 
          submissions, 
          userCount, 
          checkInCount
        ] = await Promise.all([
          getTasks(),
          getTaskSubmissions(),
          getTotalUsers(),
          getTodayCheckInCount()
        ]);

        const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;

        setStats({
          totalTasks: tasks.length,
          pendingSubmissions: pendingSubmissions,
          totalUsers: userCount,
          todayCheckIns: checkInCount,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [profile]);

  if (!profile || loading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'text-blue-500',
      href: '/admin/tasks'
    },
    {
      title: 'Pending Submissions',
      value: stats.pendingSubmissions,
      icon: FileText,
      color: 'text-amber-500',
      href: '/admin/submissions'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-emerald-500',
      href: '/admin/users'
    },
    {
      title: "Today's Check-ins",
      value: stats.todayCheckIns,
      icon: TrendingUp,
      color: 'text-indigo-500',
      href: '/admin/qr' // Diarahkan ke manajemen QR
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-medium text-slate-800">Admin Dashboard</h1>
        <p className="mt-2 text-slate-500">Welcome back, {profile.name}. Here's an overview of system performance.</p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link href={card.href} key={card.title} className="bg-white rounded-xl p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className={`text-3xl font-semibold mt-2 ${card.color}`}>{card.value}</p>
                </div>
                <Icon className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80">
        <h3 className="text-lg font-medium text-slate-800 mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/admin/tasks/create"
            className="group flex items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
          >
            <Plus className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="font-semibold text-slate-700 ml-3">Create New Task</span>
          </Link>
          <Link
            href="/admin/qr"
            className="group flex items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
          >
            <QrCode className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="font-semibold text-slate-700 ml-3">Manage QR Sessions</span>
          </Link>
          <Link
            href="/admin/submissions"
            className="group flex items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
          >
            <FileText className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" />
            <span className="font-semibold text-slate-700 ml-3">Review Submissions</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getTasks } from '@/lib/tasks';
import { getUserCheckInStatus } from '@/lib/qrService';
import { CheckSquare, Clock, QrCode, Star, Trophy } from 'lucide-react';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    availableTasks: 0,
    completedTasks: 0,
    checkedInToday: false,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!profile) return;
      
      try {
        // Load tasks
        const tasks = await getTasks();
        const availableTasks = tasks.length;
        
        // Check if user checked in today
        const checkedIn = await getUserCheckInStatus(profile.uid);
        
        setStats({
          availableTasks,
          completedTasks: 0,
          checkedInToday: true,
          currentStreak: 0
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [profile]);

  if (!profile || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Current Level',
      value: profile.level,
      icon: Trophy,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Experience Points',
      value: `${profile.exp} EXP`,
      icon: Star,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Available Tasks',
      value: stats.availableTasks,
      icon: CheckSquare,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Check-in Status',
      value: stats.checkedInToday ? 'Done' : 'Pending',
      icon: Clock,
      color: stats.checkedInToday ? 'bg-green-500' : 'bg-red-500',
      textColor: stats.checkedInToday ? 'text-green-600' : 'text-red-600'
    }
  ];

  return (
    // Latar belakang abu-abu lembut untuk seluruh halaman
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Kontainer utama dengan spasi vertikal dan font default */}
      <div className="max-w-7xl mx-auto space-y-8 font-sans">
        
        {/* 1. Welcome Section: Tipografi lebih lembut */}
        <div>
          <h1 className="text-3xl font-medium text-slate-800">Welcome back, {profile.name}!</h1>
          <p className="mt-2 text-base text-slate-500">Here's your progress overview.</p>
        </div>
        
        {/* 2. Stat Cards: Tanpa shadow/border, ikon lebih elegan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              // Hilangkan 'shadow', gunakan 'rounded-xl' & hover effect halus
              <div key={card.title} className="bg-white rounded-xl p-6 transition-all duration-300 hover:bg-slate-100/70 hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    {/* Gunakan warna pada teks, bukan background ikon */}
                    <p className={`text-3xl font-semibold mt-2 ${card.textColor || 'text-slate-800'}`}>{card.value}</p>
                  </div>
                  {/* Ikon minimalis tanpa background warna */}
                  <Icon className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
                </div>
              </div>
            );
          })}
        </div>
  
        {/* 3. Progress Section: Desain bar lebih modern */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-5">Progress to Next Level</h3>
          <div className="space-y-2">
            {/* Bar yang lebih tebal dan berwarna lembut */}
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${profile.exp % 100}%` }}
              ></div>
            </div>
            <p className="text-right text-sm font-medium text-slate-500 pt-1">
              {profile.exp % 100}/100 EXP to Level {profile.level + 1}
            </p>
          </div>
        </div>
  
        {/* 4. Quick Actions: Tombol lebih bersih dan modern */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-5">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Tombol dengan ikon di samping, tanpa border */}
            <button 
              onClick={() => window.location.href = '/user/tasks'}
              className="group flex items-center p-4 bg-slate-100/70 rounded-lg hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <CheckSquare className="w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
              <p className="font-semibold text-slate-700 ml-4">View Tasks</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/user/checkin'}
              className="group flex items-center p-4 bg-slate-100/70 rounded-lg hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <QrCode className="w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
              <p className="font-semibold text-slate-700 ml-4">Daily Check-in</p>
            </button>
            
            <button 
              onClick={() => window.location.href = '/user/leaderboard'}
              className="group flex items-center p-4 bg-slate-100/70 rounded-lg hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <Trophy className="w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
              <p className="font-semibold text-slate-700 ml-4">Leaderboard</p>
            </button>
  
          </div>
        </div>
  
      </div>
    </div>
  );
}
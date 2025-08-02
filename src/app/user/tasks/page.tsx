'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getTasks } from '@/lib/tasks';
import { getUserCheckInStatus } from '@/lib/qrService';
import { CheckSquare, Clock, QrCode, Star, Trophy, TrendingUp, Target } from 'lucide-react';

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
        const tasks = await getTasks();
        const availableTasks = tasks.length;
        const checkedIn = await getUserCheckInStatus(profile.uid);
        
        setStats({
          availableTasks,
          completedTasks: 0, // Anda mungkin perlu logika untuk ini
          checkedInToday: checkedIn,
          currentStreak: 0 // Anda mungkin perlu logika untuk ini
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [profile]);

  // Tampilan loading yang lebih sesuai dengan tema
  if (!profile || loading) {
    return (
      <div className="bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-500"></div>
      </div>
    );
  }

  // Definisikan data kartu dengan warna yang lebih menarik dan sesuai tema
  const statCards = [
    {
      title: 'Current Level',
      value: profile.level,
      subtitle: 'Keep it up!',
      icon: Trophy,
      color: 'text-amber-500' // Warna emas untuk piala
    },
    {
      title: 'Experience Points',
      value: profile.exp,
      subtitle: 'Total EXP earned',
      icon: Star,
      color: 'text-indigo-500' // Warna yang lebih menarik
    },
    {
      title: 'Available Tasks',
      value: stats.availableTasks,
      subtitle: 'Tasks to complete',
      icon: CheckSquare,
      color: 'text-blue-500' // Warna biru sebagai warna primer
    },
    {
      title: 'Check-in Status',
      value: stats.checkedInToday ? 'Complete' : 'Pending',
      subtitle: 'Today\'s check-in',
      icon: Clock,
      // Warna tetap menggunakan status untuk kejelasan
      color: stats.checkedInToday ? 'text-emerald-500' : 'text-orange-500'
    }
  ];

  const quickActions = [
    {
      title: 'View Tasks',
      description: 'Browse available tasks',
      href: '/user/tasks',
      icon: CheckSquare,
    },
    {
      title: 'Daily Check-in',
      description: 'Complete your daily check-in',
      href: '/user/checkin',
      icon: QrCode,
    },
    {
      title: 'Leaderboard',
      description: 'See your ranking',
      href: '/user/leaderboard',
      icon: Trophy,
    }
  ];

  const progressPercentage = (profile.exp % 100);
  const expToNext = 100 - (profile.exp % 100);

  // --- RENDER JSX DENGAN DESAIN BARU ---
  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 font-sans">
        {/* Welcome Section */}
        <div className="text-left">
          <h1 className="text-3xl font-medium text-slate-800">Welcome back, {profile.name}</h1>
          <p className="mt-2 text-base text-slate-500">Here's your progress overview. Keep up the great work!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white rounded-xl p-6 transition-all duration-300 hover:bg-slate-100/70 hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className={`text-3xl font-semibold mt-2 ${card.color}`}>{card.value}</p>
                    <p className="text-xs text-slate-400 mt-2">{card.subtitle}</p>
                  </div>
                  <Icon className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress & Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Progress Section */}
          <div className="bg-white rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium text-slate-800">Level Progress</h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" strokeWidth={2} />
                <span className="text-sm font-medium text-slate-600">{expToNext} EXP to next level</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-500">Level {profile.level}</span>
                <span className="font-medium text-slate-500">Level {profile.level + 1}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-center pt-1">
                <span className="text-sm font-medium text-slate-500">
                  {profile.exp % 100}/100 EXP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center mb-5">
              <Target className="w-5 h-5 text-slate-700 mr-3" strokeWidth={2} />
              <h3 className="text-lg font-medium text-slate-800">Quick Actions</h3>
            </div>
            <div className="space-y-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button 
                    key={action.title}
                    onClick={() => window.location.href = action.href}
                    className="group w-full p-4 bg-slate-100/70 rounded-lg hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all text-left"
                  >
                    <div className="flex items-start space-x-4">
                      <Icon className="w-6 h-6 text-slate-500 group-hover:text-blue-500 transition-colors duration-300 mt-0.5" strokeWidth={1.5} />
                      <div>
                        <p className="font-semibold text-red-700">{action.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
          checkedInToday: checkedIn,
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile.name}!</h1>
        <p className="text-gray-600">Here's your progress overview</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${card.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                      <dd className={`text-lg font-medium ${card.textColor}`}>{card.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress to next level */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Progress to Next Level</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
            style={{ width: `${(profile.exp % 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {profile.exp % 100}/100 EXP to reach Level {profile.level + 1}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/user/tasks'}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
            >
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="font-medium">View Tasks</p>
            </button>
            <button 
              onClick={() => window.location.href = '/user/checkin'}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
            >
              <QrCode className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-medium">Daily Check-in</p>
            </button>
            <button 
              onClick={() => window.location.href = '/user/leaderboard'}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
            >
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="font-medium">Leaderboard</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
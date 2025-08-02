'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { getTasks } from '@/lib/tasks';
import { CheckSquare, Users, FileText, TrendingUp, QrCode } from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingSubmissions: 0,
    totalUsers: 0,
    todayCheckIns: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!profile) return;
      
      try {
        const tasks = await getTasks();
        setStats({
          totalTasks: tasks.length,
          pendingSubmissions: 0, // Will be updated when we implement submissions
          totalUsers: 1, // Placeholder
          todayCheckIns: 0 // Placeholder
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
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
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-blue-500',
      href: '/admin/tasks'
    },
    {
      title: 'Pending Submissions',
      value: stats.pendingSubmissions,
      icon: FileText,
      color: 'bg-yellow-500',
      href: '/admin/submissions'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-500',
      href: '/admin/users'
    },
    {
      title: "Today's Check-ins",
      value: stats.todayCheckIns,
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/admin/analytics'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your system performance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = card.href}>
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
                      <dd className="text-lg font-medium text-gray-900">{card.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/admin/tasks/create'}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-indigo-600 mr-3" />
                  <span className="font-medium">Create New Task</span>
                </div>
              </button>
              <button 
                onClick={() => window.location.href = '/admin/qr'}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <QrCode className="w-5 h-5 text-green-600 mr-3" />
                  <span className="font-medium">Generate QR Code</span>
                </div>
              </button>
              <button 
                onClick={() => window.location.href = '/admin/submissions'}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="font-medium">Review Submissions</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-gray-500 text-center py-8">
              No recent activity to show. Activity will appear here once users start interacting with tasks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
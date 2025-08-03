'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserActivities, getActivityStats, UserActivity } from '@/lib/tasks';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star, 
  Calendar,
  TrendingUp,
  Award,
  Target,
  Activity,
  Filter,
  BarChart3
} from 'lucide-react';

interface ActivityStats {
  totalActivities: number;
  tasksSubmitted: number;
  tasksCompleted: number;
  tasksRejected: number;
  checkIns: number;
  totalExpEarned: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
}

export default function UserHistory() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    tasksSubmitted: 0,
    tasksCompleted: 0,
    tasksRejected: 0,
    checkIns: 0,
    totalExpEarned: 0,
    thisWeekActivities: 0,
    thisMonthActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tasks' | 'check-ins'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    const loadUserHistory = async () => {
      if (!profile) return;
      
      try {
        const [userActivities, activityStats] = await Promise.all([
          getUserActivities(profile.uid),
          getActivityStats(profile.uid)
        ]);
        
        setActivities(userActivities);
        setStats(activityStats);
      } catch (error) {
        console.error('Error loading user history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserHistory();
  }, [profile]);

  const getFilteredActivities = () => {
    let filtered = activities;
    
    // Filter by type
    if (filter === 'tasks') {
      filtered = filtered.filter(a => 
        a.type === 'task_submission' || a.type === 'task_accepted' || a.type === 'task_rejected'
      );
    } else if (filter === 'check-ins') {
      filtered = filtered.filter(a => a.type === 'check_in');
    }
    
    // Filter by time
    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(a => a.timestamp >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(a => a.timestamp >= monthAgo);
    }
    
    return filtered;
  };

  const getActivityIcon = (activity: UserActivity) => {
    switch (activity.type) {
      case 'task_submission':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'task_accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'task_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'check_in':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityColor = (activity: UserActivity) => {
    switch (activity.type) {
      case 'task_submission':
        return 'border-l-blue-500 bg-blue-50';
      case 'task_accepted':
        return 'border-l-green-500 bg-green-50';
      case 'task_rejected':
        return 'border-l-red-500 bg-red-50';
      case 'check_in':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredActivities = getFilteredActivities();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-600">Track your completed tasks and check-ins</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasksCompleted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkIns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total EXP Earned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExpEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.tasksCompleted}</div>
            <div className="text-sm text-gray-600">Tasks Completed</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.tasksSubmitted > 0 ? 
                `${Math.round((stats.tasksCompleted / stats.tasksSubmitted) * 100)}% success rate` 
                : 'No submissions yet'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.thisWeekActivities}</div>
            <div className="text-sm text-gray-600">This Week</div>
            <div className="text-xs text-gray-500 mt-1">Activities completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.thisMonthActivities}</div>
            <div className="text-sm text-gray-600">This Month</div>
            <div className="text-xs text-gray-500 mt-1">Activities completed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
<div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5">
  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
    
    {/* Label Filter */}
    <div className="flex items-center space-x-2 flex-shrink-0">
      <Filter className="w-5 h-5 text-zinc-400" />
      <span className="text-sm font-medium text-zinc-600">Filter by:</span>
    </div>
    
    {/* Grup Tombol Filter */}
    <div className="flex flex-wrap items-center gap-2">
      
      {/* Filter Tipe Aktivitas */}
      {[
        { key: 'all', label: 'All Activities' },
        { key: 'tasks', label: 'Tasks' },
        { key: 'check-ins', label: 'Check-ins' }
      ].map((option) => (
        <button
          key={option.key}
          onClick={() => setFilter(option.key as any)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            filter === option.key
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
          }`}
        >
          {option.label}
        </button>
      ))}

      {/* Garis Pemisah (hanya terlihat di layar besar) */}
      <div className="w-px h-6 bg-zinc-200 hidden sm:block mx-2"></div>
      
      {/* Filter Waktu */}
      {[
        { key: 'all', label: 'All Time' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' }
      ].map((option) => (
        <button
          key={option.key}
          onClick={() => setTimeFilter(option.key as any)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            timeFilter === option.key
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
</div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activities ({filteredActivities.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-6 border-l-4 ${getActivityColor(activity)} hover:bg-opacity-75 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                        {(activity.data.expReward || activity.data.checkInReward) && (
                          <span className="flex items-center text-green-600">
                            <Star className="w-3 h-3 mr-1" />
                            +{activity.data.expReward || activity.data.checkInReward} EXP
                          </span>
                        )}
                        {activity.data.checkInStreak && (
                          <span className="flex items-center text-purple-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {activity.data.checkInStreak} day streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {activity.timestamp.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No activity yet' : 
                 filter === 'tasks' ? 'No task activity' : 'No check-in activity'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' ? 'Your completed tasks and check-ins will appear here' :
                 filter === 'tasks' ? 'Complete some tasks to see them here' : 
                 'Check-in daily to see your streak here'}
              </p>
              <button
                onClick={() => window.location.href = '/user/tasks'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Target className="w-4 h-4 mr-2" />
                Start Completing Tasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
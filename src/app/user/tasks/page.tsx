'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTasks, Task } from '@/lib/tasks';
import { Clock, Star, ChevronRight, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function UserTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const allTasks = await getTasks();
        setTasks(allTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Available Tasks</h1>
        <p className="text-gray-600">Complete tasks to earn experience points and level up!</p>
      </div>

      {/* Filter buttons */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {['all', 'easy', 'medium', 'hard'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === filterOption
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                  Task
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="w-4 h-4 mr-1" />
                  {task.expReward} EXP
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{task.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(task.createdAt).toLocaleDateString()}
                </div>
                <Link
                  href={`/user/tasks/${task.id}`}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks available</h3>
          <p className="text-gray-500">Check back later for new tasks!</p>
        </div>
      )}
    </div>
  );
}
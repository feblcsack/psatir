'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTasks, Task, getTaskSubmissions, TaskSubmission } from '@/lib/tasks';
import { Clock, Star, ChevronRight, CheckSquare, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

interface TaskWithSubmission extends Task {
  userSubmission?: TaskSubmission;
}

export default function UserTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const loadTasksWithSubmissions = async () => {
      if (!profile) return;
      
      try {
        const allTasks = await getTasks();
        const allSubmissions = await getTaskSubmissions();
        
        // Map tasks with user's submissions
        const tasksWithSubmissions: TaskWithSubmission[] = allTasks.map(task => {
          const userSubmission = allSubmissions.find(
            sub => sub.taskId === task.id && sub.userId === profile.uid
          );
          
          return {
            ...task,
            userSubmission
          };
        });
        
        setTasks(tasksWithSubmissions);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasksWithSubmissions();
  }, [profile]);

  const getFilteredTasks = () => {
    switch (filter) {
      case 'available':
        return tasks.filter(task => !task.userSubmission);
      case 'pending':
        return tasks.filter(task => task.userSubmission?.status === 'pending');
      case 'completed':
        return tasks.filter(task => task.userSubmission?.status === 'accepted');
      default:
        return tasks;
    }
  };

  const getTaskStatusBadge = (task: TaskWithSubmission) => {
    if (!task.userSubmission) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Available
        </span>
      );
    }

    switch (task.userSubmission.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
    }
  };

  const getTaskCardStyle = (task: TaskWithSubmission) => {
    if (task.userSubmission?.status === 'accepted') {
      return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow";
    }
    if (task.userSubmission?.status === 'pending') {
      return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow";
    }
    if (task.userSubmission?.status === 'rejected') {
      return "bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow";
    }
    return "bg-white border-gray-100 shadow hover:shadow-md transition-shadow";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Available Tasks</h1>
        <p className="text-gray-600">Complete tasks to earn experience points and level up!</p>
      </div>

      {/* Filter buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Tasks', count: tasks.length },
            { key: 'available', label: 'Available', count: tasks.filter(t => !t.userSubmission).length },
            { key: 'pending', label: 'Pending Review', count: tasks.filter(t => t.userSubmission?.status === 'pending').length },
            { key: 'completed', label: 'Completed', count: tasks.filter(t => t.userSubmission?.status === 'accepted').length },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className={`border rounded-lg overflow-hidden ${getTaskCardStyle(task)}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                {getTaskStatusBadge(task)}
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
                  {task.userSubmission?.status === 'accepted' ? 'View Details' : 
                   task.userSubmission?.status === 'pending' ? 'View Status' :
                   task.userSubmission?.status === 'rejected' ? 'Resubmit' : 'Start Task'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Show submission info if exists */}
              {task.userSubmission && (
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <div className="text-xs text-gray-500">
                    {task.userSubmission.status === 'accepted' && (
                      <span className="text-green-600 font-medium">
                        ✅ Completed on {task.userSubmission.reviewedAt?.toLocaleDateString()}
                      </span>
                    )}
                    {task.userSubmission.status === 'pending' && (
                      <span className="text-yellow-600 font-medium">
                        ⏳ Submitted on {task.userSubmission.submittedAt.toLocaleDateString()}
                      </span>
                    )}
                    {task.userSubmission.status === 'rejected' && (
                      <span className="text-red-600 font-medium">
                        ❌ Rejected on {task.userSubmission.reviewedAt?.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'available' ? 'No available tasks' :
             filter === 'pending' ? 'No pending submissions' :
             filter === 'completed' ? 'No completed tasks' : 'No tasks found'}
          </h3>
          <p className="text-gray-500">
            {filter === 'available' ? 'All tasks have been submitted!' :
             filter === 'pending' ? 'No submissions waiting for review.' :
             filter === 'completed' ? 'Complete some tasks to see them here!' : 'Check back later for new tasks!'}
          </p>
        </div>
      )}
    </div>
  );
}
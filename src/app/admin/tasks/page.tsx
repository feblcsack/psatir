'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTasks, Task } from '@/lib/tasks';
import { Plus, Edit, Trash2, Star, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function ManageTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tasks</h1>
          <p className="text-gray-600">Create, edit, and manage all tasks</p>
        </div>
        <Link
          href="/admin/tasks/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first task</p>
          <Link
            href="/admin/tasks/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Task
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Tasks ({tasks.length})</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                      <div className="ml-3 flex items-center text-sm text-green-600">
                        <Star className="w-4 h-4 mr-1" />
                        {task.expReward} EXP
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      Created on {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                    <button className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

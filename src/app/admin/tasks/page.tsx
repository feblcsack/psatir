'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// 1. Impor deleteTask
import { getTasks, deleteTask, Task } from '@/lib/tasks';
import { Plus, Edit, Trash2, Star, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // Direkomendasikan untuk notifikasi

export default function ManageTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  // 2. Tambahkan state untuk loading saat proses delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const allTasks = await getTasks();
        setTasks(allTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast.error('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // 3. Buat fungsi handler untuk delete
  const handleDelete = async (taskId: string) => {
    // Tambahkan konfirmasi sebelum menghapus
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setDeletingId(taskId);
    try {
      await deleteTask(taskId);
      // Hapus task dari state agar UI langsung ter-update tanpa refresh
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Asumsi Anda sudah memiliki semua state dan fungsi (handleDelete, tasks, dll)
// di atas bagian return ini.

return (
  // Latar belakang utama yang sedikit off-white untuk kesan lembut
  <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto font-sans">
      {/* Header: Tipografi lebih ringan dan warna lebih lembut */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-slate-800">Manage Tasks</h1>
          <p className="mt-2 text-slate-500">Create, edit, and manage all tasks.</p>
        </div>
        <Link
          href="/admin/tasks/create"
          className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        // Empty State: Desain lebih bersih dengan border putus-putus
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No tasks yet</h3>
          <p className="text-slate-500 mb-6">Get started by creating your first task.</p>
          <Link
            href="/admin/tasks/create"
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Task
          </Link>
        </div>
      ) : (
        // Task List: Tanpa shadow, menggunakan border halus
        <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/70">
            <h3 className="text-lg font-medium text-slate-800">All Tasks ({tasks.length})</h3>
          </div>
          <ul>
            {tasks.map((task) => (
              <li key={task.id} className="px-6 py-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-medium text-slate-800 truncate">{task.title}</h4>
                      <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 mr-1.5" />
                        {task.expReward} EXP
                      </div>
                    </div>
                    <p className="text-slate-600 mt-2 text-sm line-clamp-2">{task.description}</p>
                    <div className="text-xs text-slate-400 mt-3">
                      Created on {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                  {/* Tombol Aksi: Desain lebih subtle tanpa border */}
                  <div className="flex items-center space-x-1 ml-4">
                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="p-2 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 rounded-md transition-colors"
                      title="Edit Task"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(task.id!)}
                      disabled={deletingId === task.id}
                      className="p-2 text-slate-500 hover:bg-rose-100 hover:text-rose-700 rounded-md transition-colors disabled:opacity-50"
                      title="Delete Task"
                    >
                      {deletingId === task.id ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);
}
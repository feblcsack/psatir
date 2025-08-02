'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getTasks, Task, submitTaskProof } from '@/lib/tasks';
import { Star, Clock, Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const tasks = await getTasks();
        const foundTask = tasks.find(t => t.id === taskId);
        setTask(foundTask || null);
      } catch (error) {
        console.error('Error loading task:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !profile) return;

    if (!proofText.trim() && !proofFile) {
      toast.error('Please provide proof (text or file)');
      return;
    }

    setSubmitting(true);
    try {
      // For now, we'll just use text proof
      // In production, you'd upload the file to Firebase Storage first
      const proofURL = proofFile ? `file_${proofFile.name}` : proofText;
      
      await submitTaskProof({
        taskId: task.id!,
        userId: profile.uid,
        proofURL,
        status: 'pending'
      });

      toast.success('Proof submitted successfully! Waiting for admin review.');
      router.push('/user/tasks');
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Failed to submit proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
        <button
          onClick={() => router.push('/user/tasks')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to tasks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tasks
      </button>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex items-center text-lg font-medium text-green-600">
              <Star className="w-5 h-5 mr-1" />
              {task.expReward} EXP
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <Clock className="w-4 h-4 mr-1" />
            Created on {new Date(task.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap mb-6">{task.description}</p>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Proof</h3>
            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof Description
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe what you did to complete this task..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {proofFile && (
                    <span className="text-sm text-green-600">
                      Selected: {proofFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Proof
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

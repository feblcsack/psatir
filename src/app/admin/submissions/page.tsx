'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTaskSubmissions, reviewSubmission, TaskSubmission } from '@/lib/tasks';
import { CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Submissions() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const allSubmissions = await getTaskSubmissions();
        setSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error loading submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleReview = async (taskId: string, submissionId: string, status: 'accepted' | 'rejected') => {
    if (!profile) return;

    setReviewingId(submissionId);
    try {
      await reviewSubmission(taskId, submissionId, status, profile.uid);
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, status, reviewedAt: new Date(), reviewedBy: profile.uid }
          : sub
      ));
      
      toast.success(`Submission ${status} successfully!`);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission. Please try again.');
    } finally {
      setReviewingId(null);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Task Submissions</h1>
        <p className="text-gray-600">Review and approve user task submissions</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Submissions', count: submissions.length },
              { key: 'pending', label: 'Pending', count: submissions.filter(s => s.status === 'pending').length },
              { key: 'accepted', label: 'Accepted', count: submissions.filter(s => s.status === 'accepted').length },
              { key: 'rejected', label: 'Rejected', count: submissions.filter(s => s.status === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'Submissions will appear here when users complete tasks'
              : `No ${filter} submissions at this time`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => {
              const StatusIcon = getStatusIcon(submission.status);
              return (
                <li key={submission.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <StatusIcon className={`w-5 h-5 ${
                            submission.status === 'accepted' ? 'text-green-500' :
                            submission.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              Task ID: {submission.taskId}
                            </h4>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-600">
                              <strong>User ID:</strong> {submission.userId}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Proof:</strong> {submission.proofURL}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Submitted on {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                            {submission.reviewedAt && (
                              <p className="text-sm text-gray-500">
                                Reviewed on {new Date(submission.reviewedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {submission.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleReview(submission.taskId, submission.id!, 'accepted')}
                          disabled={reviewingId === submission.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {reviewingId === submission.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReview(submission.taskId, submission.id!, 'rejected')}
                          disabled={reviewingId === submission.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {reviewingId === submission.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
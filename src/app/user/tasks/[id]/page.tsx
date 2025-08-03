'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { getTasks, Task, submitTaskProof, getUserTaskSubmission, TaskSubmission } from '@/lib/tasks';
import { compressAndConvertToBase64, isFileSizeValid, getFileSizeString } from '@/lib/imageUpload';
import { Star, Clock, Upload, ArrowLeft, X, Eye, Image as ImageIcon, CheckCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [userSubmission, setUserSubmission] = useState<TaskSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofText, setProofText] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  useEffect(() => {
    const loadTaskAndSubmission = async () => {
      if (!profile) return;
      
      try {
        const tasks = await getTasks();
        const foundTask = tasks.find(t => t.id === taskId);
        setTask(foundTask || null);
        
        if (foundTask) {
          const submission = await getUserTaskSubmission(taskId, profile.uid);
          setUserSubmission(submission);
        }
      } catch (error) {
        console.error('Error loading task:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTaskAndSubmission();
  }, [taskId, profile]);

  // Handle file selection and create preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Check file size (max 10MB)
      if (!isFileSizeValid(file, 10)) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
    }

    setProofFile(file);
    
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Create preview URL for images
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const removeFile = () => {
    setProofFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !profile) return;

    if (!proofText.trim() && !proofFile) {
      toast.error('Please provide proof (text or image)');
      return;
    }

    setSubmitting(true);
    setProcessing(true);
    
    try {
      let proofURL = proofText;
      
      // If image file is selected, compress and convert to base64
      if (proofFile) {
        toast.loading('Processing image...');
        setCompressionProgress(25);
        
        // Compress and convert to base64
        const base64Image = await compressAndConvertToBase64(proofFile, 800, 0.8);
        setCompressionProgress(75);
        
        proofURL = base64Image;
        setCompressionProgress(100);
        
        toast.dismiss();
        toast.success('Image processed successfully!');
      }
      
      // Submit the proof with the base64 image
      await submitTaskProof({
        taskId: task.id!,
        userId: profile.uid,
        proofURL,
        status: 'pending'
      });

      toast.success('Proof submitted successfully! Waiting for admin review.');
      
      // Refresh submission status
      const submission = await getUserTaskSubmission(taskId, profile.uid);
      setUserSubmission(submission);
      
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Failed to submit proof. Please try again.');
    } finally {
      setSubmitting(false);
      setProcessing(false);
      setCompressionProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    return '📎';
  };

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  const getSubmissionStatusBadge = (submission: TaskSubmission) => {
    switch (submission.status) {
      case 'pending':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Pending Review
          </div>
        );
      case 'accepted':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Accepted (+{task?.expReward} EXP)
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <X className="w-4 h-4 mr-1" />
            Rejected
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
        <button
          onClick={() => router.push('/user/tasks')}
          className="text-blue-600 hover:text-blue-500"
        >
          Back to tasks
        </button>
      </div>
    );
  }

  const canSubmit = !userSubmission || userSubmission.status === 'rejected';
  const isCompleted = userSubmission?.status === 'accepted';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tasks
      </button>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-medium text-gray-900">{task.title}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-lg font-medium text-emerald-600">
                <Star className="w-5 h-5 mr-1" />
                {task.expReward} EXP
              </div>
              {userSubmission && getSubmissionStatusBadge(userSubmission)}
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-400 mt-3">
            <Clock className="w-4 h-4 mr-1" />
            Created on {new Date(task.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
          <p className="text-gray-600 whitespace-pre-wrap mb-8 leading-relaxed">{task.description}</p>

          {/* Task Completed Message */}
          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-green-800 mb-1">Task Completed! 🎉</h4>
                  <p className="text-green-700">
                    You've successfully completed this task and earned <strong>{task.expReward} EXP</strong>!
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Submitted on {userSubmission.submittedAt.toLocaleDateString()} • 
                    Reviewed on {userSubmission.reviewedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show existing submission info if pending */}
          {userSubmission && userSubmission.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-yellow-800 mb-1">Submission Under Review</h4>
                  <p className="text-yellow-700">
                    Your proof has been submitted and is waiting for admin review.
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Submitted on {userSubmission.submittedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show rejection message and allow resubmit */}
          {userSubmission && userSubmission.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <X className="w-8 h-8 text-red-600 mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-red-800 mb-1">Submission Rejected</h4>
                  <p className="text-red-700">
                    Your previous submission was rejected. You can submit new proof below.
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Reviewed on {userSubmission.reviewedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Form - Only show if can submit */}
          {canSubmit && (
            <div className="border-t border-gray-50 pt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {userSubmission?.status === 'rejected' ? 'Resubmit Proof' : 'Submit Proof'}
              </h3>
              
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium mb-1">Image Upload Guidelines</p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Maximum file size: 10MB</li>
                      <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                      <li>• Images will be automatically compressed for faster loading</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Proof Description
                  </label>
                  <textarea
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Describe what you did to complete this task..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Upload Image <span className="text-gray-400">(Optional)</span>
                  </label>
                  
                  {!proofFile ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full mb-4">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-2">Upload an image</p>
                        <p className="text-sm text-gray-500 mb-1">Click to browse or drag and drop</p>
                        <p className="text-xs text-gray-400">JPG, PNG, GIF, WebP (Max 10MB)</p>
                      </label>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* File Info Header */}
                      <div className="flex items-center justify-between p-4 bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(proofFile)}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {proofFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getFileSizeString(proofFile.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {previewUrl && (
                            <button
                              type="button"
                              onClick={() => setShowPreview(true)}
                              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white transition-colors"
                              title="Preview image"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={removeFile}
                            className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Image Preview */}
                      {previewUrl && isImageFile(proofFile) && (
                        <div className="p-4">
                          <div className="relative">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full max-h-64 object-contain rounded-lg border border-gray-100 bg-gray-50"
                            />
                            <div className="absolute top-2 right-2">
                              <button
                                type="button"
                                onClick={() => setShowPreview(true)}
                                className="p-1.5 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Compression Progress */}
                      {processing && compressionProgress > 0 && (
                        <div className="p-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Processing image...</span>
                            <span>{compressionProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${compressionProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-50">
                  <button
                    type="submit"
                    disabled={submitting || processing || (!proofText.trim() && !proofFile)}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting || processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {processing ? 'Processing...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {userSubmission?.status === 'rejected' ? 'Resubmit Proof' : 'Submit Proof'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {showPreview && previewUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
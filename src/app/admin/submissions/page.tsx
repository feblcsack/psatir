'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTaskSubmissions, reviewSubmission, TaskSubmission } from '@/lib/tasks';
import { CheckCircle, XCircle, Clock, Eye, FileText, Image as ImageIcon, Download, ExternalLink, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Submissions() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const allSubmissions = await getTaskSubmissions();
        setSubmissions(allSubmissions);
      } catch (error) {
        console.error('Error loading submissions:', error);
        toast.error('Failed to load submissions');
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

  const isBase64Image = (url: string) => {
    return url.startsWith('data:image/');
  };

  const isImageURL = (url: string) => {
    // Check for base64 images
    if (isBase64Image(url)) {
      return true;
    }
    
    // Check if it's a valid URL first
    try {
      new URL(url);
    } catch {
      return false;
    }
    
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || 
           url.includes('firebase') || 
           url.includes('storage.googleapis.com') ||
           url.includes('imgur') ||
           url.includes('cloudinary');
  };

  const isValidURL = (url: string) => {
    // Base64 URLs are valid for our purposes  
    if (url.startsWith('data:')) {
      return true;
    }
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageLoad = (submissionId: string) => {
    setImageLoading(prev => ({ ...prev, [submissionId]: false }));
  };

  const handleImageError = (submissionId: string) => {
    setImageLoading(prev => ({ ...prev, [submissionId]: false }));
  };

  const handleImageClick = (url: string, submissionId: string) => {
    setImageLoading(prev => ({ ...prev, [submissionId]: true }));
    setSelectedImage(url);
  };

  const downloadBase64Image = (base64: string, fileName: string = 'image') => {
    try {
      const link = document.createElement('a');
      link.href = base64;
      link.download = `${fileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const openImageInNewTab = (base64: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<img src="${base64}" style="max-width: 100%; height: auto;" />`);
    }
  };

  const getImageSize = (base64: string): string => {
    try {
      // Rough calculation of base64 size
      const padding = (base64.match(/=/g) || []).length;
      const bytes = (base64.length * 0.75) - padding;
      
      if (bytes < 1024) return `${bytes.toFixed(0)} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return 'Unknown size';
    }
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'accepted': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
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
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Submissions</h1>
        <p className="text-gray-600">Review and approve user task submissions</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: submissions.length },
              { key: 'pending', label: 'Pending', count: submissions.filter(s => s.status === 'pending').length },
              { key: 'accepted', label: 'Accepted', count: submissions.filter(s => s.status === 'accepted').length },
              { key: 'rejected', label: 'Rejected', count: submissions.filter(s => s.status === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.key ? 'bg-gray-100' : 'bg-gray-50'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No submissions found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'Submissions will appear here when users complete tasks'
              : `No ${filter} submissions at this time`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSubmissions.map((submission) => {
            const StatusIcon = getStatusIcon(submission.status);
            const isImage = isImageURL(submission.proofURL);
            const isBase64 = isBase64Image(submission.proofURL);
            const isLoading = imageLoading[submission.id!];
            
            return (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0">
                        <StatusIcon className={`w-6 h-6 ${
                          submission.status === 'accepted' ? 'text-emerald-500' :
                          submission.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          Task ID: {submission.taskId}
                        </h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)} mt-2`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
  <span className="text-gray-500 font-medium">Submitted by:</span>
  <p className="text-gray-800 mt-1">{submission.userName || 'Unknown User'}</p>
  {submission.userEmail && (
    <p className="text-gray-500 text-xs mt-0.5">{submission.userEmail}</p>
  )}
</div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-500 font-medium">Submitted:</span>
                          <p className="text-gray-800 mt-1">{new Date(submission.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                      </div>

                      {/* Proof Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Proof Submission</h5>
                          {isValidURL(submission.proofURL) && (
                            <div className="flex items-center gap-2">
                              {isBase64 ? (
                                <>
                                  <button
                                    onClick={() => downloadBase64Image(submission.proofURL, `proof_${submission.id}`)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </button>
                                  <button
                                    onClick={() => openImageInNewTab(submission.proofURL)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open
                                  </button>
                                </>
                              ) : (
                                <a
                                  href={submission.proofURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Open
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          {isImage && isValidURL(submission.proofURL) ? (
                            <div className="space-y-3">
                              {/* Image Preview */}
                              <div className="flex flex-col sm:flex-row gap-4">
                                <div 
                                  className="relative w-full sm:w-40 h-32 bg-gray-50 rounded-xl overflow-hidden cursor-pointer group border-2 border-gray-100 hover:border-gray-300 transition-colors"
                                  onClick={() => handleImageClick(submission.proofURL, submission.id!)}
                                >
                                  {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                  <img
                                    src={submission.proofURL}
                                    alt="Submission proof"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    onLoad={() => handleImageLoad(submission.id!)}
                                    onError={() => handleImageError(submission.id!)}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                                      <ZoomIn className="w-4 h-4 text-gray-700" />
                                    </div>
                                  </div>
                                  {/* Image type indicator */}
                                  <div className="absolute top-2 left-2">
                                    <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3" />
                                      {isBase64 ? 'IMG' : 'URL'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Image Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">Image Details:</div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Type:</span>
                                        <span className="text-gray-800">{isBase64 ? 'Base64 Image' : 'URL Image'}</span>
                                      </div>
                                      {isBase64 && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Size:</span>
                                          <span className="text-gray-800">{getImageSize(submission.proofURL)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Text content if any */}
                                  {!isBase64 && (
                                    <div className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded">
                                      URL: {truncateText(submission.proofURL, 80)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
                              <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                {isValidURL(submission.proofURL) ? (
                                  <a 
                                    href={submission.proofURL} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-700 break-all underline"
                                  >
                                    {truncateText(submission.proofURL, 100)}
                                  </a>
                                ) : (
                                  <div className="text-sm text-gray-700 break-all">
                                    {truncateText(submission.proofURL, 200)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {submission.reviewedAt && (
                        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                          Reviewed on {new Date(submission.reviewedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {submission.status === 'pending' && (
                    <div className="flex flex-row lg:flex-col gap-3 lg:w-32">
                      <button
                        onClick={() => handleReview(submission.taskId, submission.id!, 'accepted')}
                        disabled={reviewingId === submission.id}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {reviewingId === submission.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Accept</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReview(submission.taskId, submission.id!, 'rejected')}
                        disabled={reviewingId === submission.id}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {reviewingId === submission.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 lg:mr-0 mr-2" />
                            <span className="lg:hidden">Reject</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && isValidURL(selectedImage) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={selectedImage}
              alt="Submission proof"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={() => setSelectedImage(null)}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition-colors text-xl"
            >
              ×
            </button>
            
            {/* Download button for base64 images */}
            {isBase64Image(selectedImage) && (
              <button
                onClick={() => downloadBase64Image(selectedImage, 'proof_image')}
                className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
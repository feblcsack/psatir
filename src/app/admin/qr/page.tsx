'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  generateScheduledQR, 
  getAllQRSessions, 
  deactivateQRSession,
  applyPenalties,
  getSessionStats,
  QRSession 
} from '@/lib/qrService';
import QRCode from 'react-qr-code';
import { 
  QrCode, 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  AlertTriangle,
  Download,
  Eye,
  Power,
  TrendingUp,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GenerateQR() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<QRSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [applyingPenalty, setApplyingPenalty] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    expReward: 10,
    penaltyExp: 5,
    requiredUsers: ''
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await getAllQRSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load QR sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Parse dates and times
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      // Validation
      if (startDateTime >= endDateTime) {
        toast.error('End time must be after start time');
        return;
      }

      if (startDateTime < new Date()) {
        toast.error('Start time cannot be in the past');
        return;
      }

      // Parse all users (comma-separated email/ID list)
      const requiredUsers = formData.requiredUsers // ## PERBAIKAN: Gunakan nama yang konsisten
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (requiredUsers.length === 0) { // ## PERBAIKAN: Gunakan nama yang konsisten
      toast.error('Please provide at least one user ID/email for penalties');
      setLoading(false);
      return;
    }


      await generateScheduledQR(
        formData.title,
        formData.description,
        startDateTime,
        endDateTime,
        formData.expReward,
        formData.penaltyExp,
        profile.uid,
        requiredUsers
      );

      toast.success('QR Session created successfully!');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        expReward: 10,
        penaltyExp: 5,
        requiredUsers: ''
      });
      loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create QR session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSession = async (sessionId: string) => {
    try {
      await deactivateQRSession(sessionId);
      toast.success('Session deactivated successfully');
      loadSessions();
    } catch (error) {
      console.error('Error deactivating session:', error);
      toast.error('Failed to deactivate session');
    }
  };

  const handleApplyPenalties = async (sessionId: string) => {
    setApplyingPenalty(sessionId);
    try {
      await applyPenalties(sessionId);
      toast.success('Penalties applied successfully');
      loadSessions();
    } catch (error) {
      console.error('Error applying penalties:', error);
      toast.error('Failed to apply penalties');
    } finally {
      setApplyingPenalty(null);
    }
  };

  const downloadQR = (qrData: string, title: string) => {
    const svg = document.querySelector(`#qr-${selectedSession?.id}`) as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const getSessionStatus = (session: QRSession) => {
    const now = new Date();
    const start = session.startDateTime.toDate();
    const end = session.endDateTime.toDate();

    if (!session.isActive) return { status: 'inactive', color: 'gray', text: 'Inactive' };
    if (now < start) return { status: 'upcoming', color: 'blue', text: 'Upcoming' };
    if (now >= start && now <= end) return { status: 'active', color: 'green', text: 'Active' };
    return { status: 'ended', color: 'red', text: 'Ended' };
  };

  // Set default dates (today and tomorrow)
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00'
    }));
  }, []);

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QR Check-in Management</h1>
            <p className="text-gray-600">Create and manage scheduled QR check-in sessions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-slate-600 bg-white border-slate-300"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Create New Session
          </button>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateForm && (
  // Latar belakang overlay dibuat sedikit lebih transparan
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    
    {/* Kontainer modal dengan sudut lebih bulat dan tanpa shadow yang berlebihan */}
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
      
      {/* Header Modal */}
      <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xl font-medium text-slate-800">Create QR Session</h3>
        <button 
          onClick={() => setShowCreateForm(false)}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      {/* Form dengan styling minimalis */}
      <form onSubmit={handleCreateSession} className="p-8 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          
          {/* Input field dengan desain baru */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1.5">
              Session Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
              placeholder="e.g., Morning Check-in"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
              placeholder="Optional details about this session"
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 mb-1.5">
              Start Date *
            </label>
            <input
              id="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-slate-600 mb-1.5">
              Start Time *
            </label>
            <input
              id="startTime"
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-600 mb-1.5">
              End Date *
            </label>
            <input
              id="endDate"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-slate-600 mb-1.5">
              End Time *
            </label>
            <input
              id="endTime"
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="expReward" className="block text-sm font-medium text-slate-600 mb-1.5">
              EXP Reward
            </label>
            <input
              id="expReward"
              type="number"
              min="1"
              value={formData.expReward}
              onChange={(e) => setFormData({...formData, expReward: parseInt(e.target.value)})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="penaltyExp" className="block text-sm font-medium text-slate-600 mb-1.5">
              Penalty EXP
            </label>
            <input
              id="penaltyExp"
              type="number"
              min="0"
              value={formData.penaltyExp}
              onChange={(e) => setFormData({...formData, penaltyExp: parseInt(e.target.value)})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="requiredUsers" className="block text-sm font-medium text-slate-600 mb-1.5">
              Required Users *
            </label>
            <textarea
              id="requiredUsers"
              required
              value={formData.requiredUsers}
              onChange={(e) => setFormData({...formData, requiredUsers: e.target.value})}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
              placeholder="Enter user IDs separated by commas"
            />
            <p className="text-xs text-slate-400 mt-2">
              Users who don't check-in will receive penalties.
            </p>
          </div>
        </div>

        {/* Tombol Aksi dengan desain baru */}
        <div className="flex justify-end space-x-3 pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Session'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Sessions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Sessions</h2>
          <div className="space-y-4">
            {sessions.map((session) => {
              const status = getSessionStatus(session);
              return (
                <div
                  key={session.id}
                  className={`bg-white border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedSession?.id === session.id ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{session.title}</h3>
                      {session.description && (
                        <p className="text-gray-600 text-sm mt-1">{session.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {session.startDateTime.toDate().toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {session.startDateTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {session.endDateTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="flex items-center text-gray-600">
  <Users className="w-4 h-4 mr-1" />
  {(session.attendees || []).length}/{(session.allUsers || []).length}
</div>
                    <div className="flex items-center text-gray-600">
                      <Award className="w-4 h-4 mr-1" />
                      +{session.expReward} EXP / -{session.penaltyExp} EXP
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Penalties Apply
                      </span>
                      {status.status === 'ended' && Array.isArray(session.allUsers) && session.allUsers.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPenalties(session.id!);
                          }}
                          disabled={applyingPenalty === session.id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                        >
                          {applyingPenalty === session.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700 mr-1"></div>
                          ) : (
                            <UserX className="w-3 h-3 mr-1" />
                          )}
                          Apply Penalties
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivateSession(session.id!);
                          }}
                          className="text-gray-500 hover:text-red-600"
                          title="Deactivate session"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Sessions</h3>
                <p className="text-gray-600">Create your first QR check-in session to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Session Details & QR Display */}
        <div className="lg:col-span-1">
          {selectedSession ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <QRCode
                      id={`qr-${selectedSession.id}`}
                      value={selectedSession.qrCodeData}
                      size={180}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <button
                    onClick={() => downloadQR(selectedSession.qrCodeData, selectedSession.title)}
                    className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Session Info</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="text-gray-900 font-medium">{selectedSession.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start:</span>
                        <span className="text-gray-900">
                          {selectedSession.startDateTime.toDate().toLocaleDateString()} {selectedSession.startDateTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End:</span>
                        <span className="text-gray-900">
                          {selectedSession.endDateTime.toDate().toLocaleDateString()} {selectedSession.endDateTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reward:</span>
                        <span className="text-green-600 font-medium">+{selectedSession.expReward} EXP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Penalty:</span>
                        <span className="text-red-600 font-medium">-{selectedSession.penaltyExp} EXP</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Statistics</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
  <span className="text-gray-600">Attendees:</span>
  <span className="text-gray-900 font-medium">{(selectedSession.attendees || []).length}</span>
</div>
<div className="flex justify-between">
  <span className="text-gray-600">Total Users:</span>
  <span className="text-gray-900 font-medium">{(selectedSession.allUsers || []).length}</span>
</div>
<div className="flex justify-between">
  <span className="text-gray-600">Attendance:</span>
  <span className="text-gray-900 font-medium">
    {(selectedSession.allUsers || []).length > 0 ? (((selectedSession.attendees || []).length / (selectedSession.allUsers || []).length) * 100).toFixed(1) : 0}%
  </span>
</div>
<div className="flex justify-between">
  <span className="text-gray-600">Penalized:</span>
  <span className="text-red-600 font-medium">{(selectedSession.penalizedUsers || []).length}</span>
</div>
                    </div>
                  </div>

                  {selectedSession.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        {selectedSession.description}
                      </p>
                    </div>
                  )}

{(selectedSession.attendees || []).length > 0 && (
  <div>
    <h4 className="text-sm font-medium text-gray-900 mb-2">Attendees</h4>
    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
      {(selectedSession.attendees || []).map((userId, index) => (
                          <div key={index} className="text-xs text-green-600 font-mono truncate">
                            {userId} ✓
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

{(selectedSession.allUsers || []).length > 0 && (
  <div>
    <h4 className="text-sm font-medium text-gray-900 mb-2">All Users</h4>
    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
      {(selectedSession.allUsers || []).map((userId, index) => (
        <div key={index} className={`text-xs font-mono truncate ${
          (selectedSession.attendees || []).includes(userId) 
            ? 'text-green-600' 
            : (selectedSession.penalizedUsers || []).includes(userId)
            ? 'text-red-600'
            : 'text-gray-600'
        }`}>
          {userId} {(selectedSession.attendees || []).includes(userId) && '✓'}
          {(selectedSession.penalizedUsers || []).includes(userId) && '⚠'}
        </div>
      ))}
    </div>
  </div>
)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Session</h3>
              <p className="text-gray-600">Click on a session to view details and QR code</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">Scheduled QR Check-in Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
          <div>
            <h5 className="font-medium mb-2">Creating Sessions:</h5>
            <ul className="space-y-1 text-sm">
              <li>• Set specific date and time ranges</li>
              <li>• Configure EXP rewards and penalties</li>
              <li>• Add all users who should participate</li>
              <li>• Sessions are automatically activated</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">Managing Sessions:</h5>
            <ul className="space-y-1 text-sm">
              <li>• Users can only check-in during active hours</li>
              <li>• Apply penalties after session ends to missed users</li>
              <li>• Download QR codes for display</li>
              <li>• View real-time attendance statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
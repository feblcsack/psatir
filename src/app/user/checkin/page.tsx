'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getCurrentQRSession, 
  validateAndCheckIn, 
  getUserCheckInStatus,
  QRSession 
} from '@/lib/qrService';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  QrCode, 
  CheckCircle, 
  Clock, 
  Gift, 
  Calendar,
  AlertTriangle,
  Users,
  Award,
  Timer,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckIn() {
  const { profile } = useAuth();
  const [currentSession, setCurrentSession] = useState<QRSession | null>(null);
  const [nextSession, setNextSession] = useState<QRSession | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      if (!profile) return;
      
      try {
        const status = await getUserCheckInStatus(profile.uid);
        setHasCheckedIn(status.hasCheckedIn);
        setCurrentSession(status.currentSession);
        setNextSession(status.nextSession);
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  // Timer for current session
  useEffect(() => {
    if (!currentSession) return;

    const updateTimer = () => {
      const now = new Date();
      const end = currentSession.endDateTime.toDate();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Session ended');
        setCurrentSession(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [currentSession]);

  // Scanner effect
  useEffect(() => {
    if (scanning) {
      const timer = setTimeout(() => {
        const qrReaderElement = document.getElementById('qr-reader');
        if (!qrReaderElement) {
          console.error('QR reader element not found');
          setScanning(false);
          return;
        }

        const qrScanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        qrScanner.render(
          async (decodedText) => {
            if (!profile) return;
            
            try {
              await validateAndCheckIn(decodedText, profile.uid);
              setHasCheckedIn(true);
              setCurrentSession(null);
              toast.success(`Check-in successful! +${currentSession?.expReward || 10} EXP earned!`);
              qrScanner.clear();
              setScanning(false);
              // Refresh status
              window.location.reload();
            } catch (error: any) {
              toast.error(error.message || 'Invalid QR code');
            }
          },
          (error) => {
            // Handle scan error silently
          }
        );

        setScanner(qrScanner);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scanning, profile, currentSession]);

  // Cleanup scanner
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    setScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setScanning(false);
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Check-in</h1>
        <p className="text-gray-600">Scan QR codes during scheduled sessions to earn EXP!</p>
      </div>

      {/* Current Session Card */}
      {currentSession && !hasCheckedIn ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="text-xl font-semibold">{currentSession.title}</h3>
                <p className="text-indigo-100">Active check-in session</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{timeRemaining}</div>
                <div className="text-indigo-100 text-sm">Time remaining</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {currentSession.description && (
              <div className="mb-4">
                <p className="text-gray-600">{currentSession.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-800">+{currentSession.expReward}</div>
                <div className="text-sm text-green-600">EXP Reward</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-800">{currentSession.attendees.length}</div>
                <div className="text-sm text-blue-600">Already Checked In</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Timer className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-sm font-medium text-purple-800">
                  {formatDateTime(currentSession.endDateTime.toDate()).time}
                </div>
                <div className="text-sm text-purple-600">Ends at</div>
              </div>
            </div>

            {!scanning ? (
              <div className="text-center">
                <button
                  onClick={startScanning}
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  Start QR Scanner
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Scan the QR code displayed by admin to check-in
                </p>
              </div>
            ) : (
              <div>
                <div id="qr-reader" className="mb-4 rounded-lg overflow-hidden"></div>
                <div className="text-center">
                  <button
                    onClick={stopScanning}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel Scanning
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Point your camera at the QR code
                </p>
              </div>
            )}

            {currentSession.requiredUsers && currentSession.requiredUsers.includes(profile?.uid || '') && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-yellow-800 font-medium">Mandatory Check-in</p>
                    <p className="text-yellow-700 text-sm">
                      You will lose {currentSession.penaltyExp} EXP if you don't check-in before the session ends.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : hasCheckedIn ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-6">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
          <h3 className="text-2xl font-semibold text-green-900 mb-2">Successfully Checked In!</h3>
          <p className="text-green-700 mb-4">
            You've checked in for today's session. Great job!
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-lg text-green-800 font-medium">
            <Gift className="w-5 h-5 mr-2" />
            EXP earned today
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center mb-6">
          <Clock className="w-20 h-20 mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Active Session</h3>
          <p className="text-gray-600">
            There's no check-in session available right now.
          </p>
        </div>
      )}

      {/* Next Session Card */}
      {nextSession && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Session</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              <Calendar className="w-4 h-4 mr-1" />
              Scheduled
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">{nextSession.title}</h4>
              {nextSession.description && (
                <p className="text-gray-600 text-sm">{nextSession.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{formatDateTime(nextSession.startDateTime.toDate()).date}</div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(nextSession.startDateTime.toDate()).time} - {formatDateTime(nextSession.endDateTime.toDate()).time}
                  </div>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Award className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">+{nextSession.expReward} EXP reward</div>
                  {nextSession.requiredUsers && nextSession.requiredUsers.includes(profile?.uid || '') && (
                    <div className="text-xs text-red-500">-{nextSession.penaltyExp} EXP penalty if missed</div>
                  )}
                </div>
              </div>
            </div>

            {nextSession.requiredUsers && nextSession.requiredUsers.includes(profile?.uid || '') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center text-yellow-800">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Mandatory attendance required</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check-in Benefits */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Check-in System</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full p-3 w-fit mx-auto mb-3">
              <Clock className="w-8 h-8 text-indigo-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Scheduled Sessions</h4>
            <p className="text-sm text-gray-600">
              Check-in during specific time windows set by administrators
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-3">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">EXP Rewards</h4>
            <p className="text-sm text-gray-600">
              Earn experience points for timely check-ins
            </p>
          </div>
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-3">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Penalties</h4>
            <p className="text-sm text-gray-600">
              Lose EXP for missing mandatory check-in sessions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
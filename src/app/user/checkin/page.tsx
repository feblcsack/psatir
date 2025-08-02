'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTodayQR, validateAndCheckIn, getUserCheckInStatus } from '@/lib/qrService';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle, Clock, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckIn() {
  const { profile } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!profile) return;
      
      try {
        const status = await getUserCheckInStatus(profile.uid);
        setIsCheckedIn(status);
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [profile]);

  // Effect untuk menginisialisasi scanner setelah DOM update
  useEffect(() => {
    if (scanning) {
      // Tambahkan delay kecil untuk memastikan DOM sudah ter-update
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
              setIsCheckedIn(true);
              toast.success('Check-in successful! +10 EXP earned!');
              qrScanner.clear();
              setScanning(false);
              // Refresh the page to update stats
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
      }, 100); // Delay 100ms untuk memastikan DOM ter-update

      return () => clearTimeout(timer);
    }
  }, [scanning, profile]);

  // Cleanup scanner saat component unmount atau scanning berhenti
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Daily Check-in</h1>
        <p className="text-gray-600">Scan the QR code to earn your daily bonus!</p>
      </div>

      {isCheckedIn ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-green-900 mb-2">Already Checked In!</h3>
          <p className="text-green-700">You've already checked in today. Come back tomorrow for your next bonus!</p>
          <div className="mt-4 flex items-center justify-center text-green-600">
            <Gift className="w-5 h-5 mr-2" />
            <span className="font-medium">+10 EXP earned today</span>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 text-center">
            <QrCode className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Ready for Check-in</h3>
            <p className="text-gray-600">Scan today's QR code to earn 10 EXP</p>
          </div>

          <div className="px-6 py-6">
            {!scanning ? (
              <div className="text-center">
                <button
                  onClick={startScanning}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Start QR Scanner
                </button>
              </div>
            ) : (
              <div>
                <div id="qr-reader" className="mb-4"></div>
                <div className="text-center">
                  <button
                    onClick={stopScanning}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel Scanning
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Point your camera at the QR code displayed by an admin
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Check-in available daily. Earn bonus EXP and maintain your streak!
            </div>
          </div>
        </div>
      )}

      {/* Check-in Benefits */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Check-in Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Gift className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
            <h4 className="font-medium text-gray-900">Daily Bonus</h4>
            <p className="text-sm text-gray-600">Earn 10 EXP every day</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Streak Rewards</h4>
            <p className="text-sm text-gray-600">Extra bonus for consecutive days</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Achievements</h4>
            <p className="text-sm text-gray-600">Unlock special badges</p>
          </div>
        </div>
      </div>
    </div>
  );
}
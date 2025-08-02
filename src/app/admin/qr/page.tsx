'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { generateDailyQR, getTodayQR } from '@/lib/qrService';
import QRCode from 'react-qr-code';
import { QrCode, RefreshCw, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GenerateQR() {
  const { profile } = useAuth();
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [todayQR, setTodayQR] = useState<any>(null);
  const [checkingToday, setCheckingToday] = useState(true);

  useEffect(() => {
    const checkTodayQR = async () => {
      try {
        const existing = await getTodayQR();
        if (existing) {
          setTodayQR(existing);
          setQrData(existing.qrCodeData);
        }
      } catch (error) {
        console.error('Error checking today QR:', error);
      } finally {
        setCheckingToday(false);
      }
    };

    checkTodayQR();
  }, []);

  const handleGenerateQR = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const qrCodeData = await generateDailyQR(profile.uid);
      setQrData(qrCodeData);
      
      // Refresh today's QR data
      const updated = await getTodayQR();
      setTodayQR(updated);
      
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
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
        downloadLink.download = `qr-checkin-${new Date().toISOString().slice(0, 10)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  if (checkingToday) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Generate QR Code</h1>
        <p className="text-gray-600">Create daily QR codes for user check-ins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Generator Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's QR Code
            </h3>
          </div>
          
          <div className="p-6">
            {todayQR ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-medium">QR Code Already Generated</p>
                  <p className="text-green-600 text-sm">
                    Generated at {new Date(todayQR.generatedAt.seconds * 1000).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate QR
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No QR Code Generated</h4>
                <p className="text-gray-600 mb-4">
                  Generate today's QR code for user check-ins
                </p>
                <button
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* QR Display Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">QR Code Display</h3>
          </div>
          
          <div className="p-6">
            {qrData ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                  <QRCode
                    id="qr-code"
                    value={qrData}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadQR}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </button>
                  <p className="text-sm text-gray-500">
                    Users can scan this QR code to check-in and earn 10 EXP
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-gray-500">QR code will appear here after generation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">How to use QR Check-in</h4>
        <div className="space-y-2 text-blue-800">
          <p>1. Generate a new QR code daily for users to scan</p>
          <p>2. Display the QR code where users can easily scan it</p>
          <p>3. Users will earn 10 EXP for each successful check-in</p>
          <p>4. Each user can only check-in once per day</p>
          <p>5. QR codes are valid for the entire day they're generated</p>
        </div>
      </div>
    </div>
  );
}
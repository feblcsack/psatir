'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Star } from 'lucide-react';

// Placeholder component for user history
export default function UserHistory() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-600">Track your completed tasks and check-ins</p>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
        <p className="text-gray-500 mb-4">Your completed tasks and check-ins will appear here</p>
        <button 
          onClick={() => window.location.href = '/user/tasks'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Start Completing Tasks
        </button>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/context/AuthContext';
import { User, Mail, Calendar, Star, Trophy, CheckCircle } from 'lucide-react';

export default function UserProfile() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your account information and view your progress</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Profile header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
              <p className="text-indigo-100">Level {profile.level} • {profile.exp} EXP</p>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div className="px-6 py-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Role
              </dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profile.role}
                </span>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Member Since
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString()}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Current Level
              </dt>
              <dd className="mt-1 text-sm text-gray-900">Level {profile.level}</dd>
            </div>
          </dl>
        </div>

        {/* Progress section */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progress to Next Level</h3>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${(profile.exp % 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{profile.exp % 100}/100 EXP</span>
            <span>Next: Level {profile.level + 1}</span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">{profile.exp}</h3>
          <p className="text-gray-600">Total Experience</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">{profile.level}</h3>
          <p className="text-gray-600">Current Level</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">0</h3>
          <p className="text-gray-600">Tasks Completed</p>
        </div>
      </div>
    </div>
  );
}
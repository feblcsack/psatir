'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface LeaderboardUser {
  uid: string;
  name: string;
  exp: number;
  level: number;
  rank: number;
}

export default function Leaderboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('exp', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        const leaderboardUsers = snapshot.docs.map((doc, index) => ({
          uid: doc.id,
          ...doc.data(),
          rank: index + 1
        })) as LeaderboardUser[];
        
        setUsers(leaderboardUsers);
        
        // Find current user's rank
        if (profile) {
          const currentUserRank = leaderboardUsers.find(u => u.uid === profile.uid)?.rank || null;
          setUserRank(currentUserRank);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [profile]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-200';
      case 2: return 'bg-gray-50 border-gray-200';
      case 3: return 'bg-amber-50 border-amber-200';
      default: return 'bg-white border-gray-200';
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
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600">See how you rank against other users</p>
      </div>

      {/* Current user's rank card */}
      {profile && userRank && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getRankIcon(userRank)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-indigo-900">Your Rank</h3>
                <p className="text-indigo-700">#{userRank} out of {users.length} users</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-indigo-600">
                <Star className="w-5 h-5 mr-1" />
                <span className="font-bold">{profile.exp} EXP</span>
              </div>
              <p className="text-indigo-500">Level {profile.level}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Players</h3>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li 
              key={user.uid} 
              className={`px-6 py-4 border-l-4 ${
                user.uid === profile?.uid ? 'bg-indigo-50 border-l-indigo-500' : getRankColor(user.rank)
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(user.rank)}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {user.name}
                      {user.uid === profile?.uid && (
                        <span className="ml-2 text-sm text-indigo-600">(You)</span>
                      )}
                    </h4>
                    <p className="text-gray-500">Level {user.level}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center text-green-600">
                    <Star className="w-5 h-5 mr-1" />
                    <span className="text-lg font-bold">{user.exp}</span>
                    <span className="text-sm ml-1">EXP</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
            <p className="text-gray-500">Complete tasks to start climbing the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
}
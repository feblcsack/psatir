// lib/qrService.ts

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

export interface QRSession {
  id?: string;
  title: string;
  description?: string;
  startDateTime: Timestamp;
  endDateTime: Timestamp;
  qrCodeData: string;
  generatedBy: string;
  createdAt: Timestamp;
  isActive: boolean;
  expReward: number;
  penaltyExp: number;
  attendees: string[]; // Users who checked in
  penalizedUsers: string[]; // Users who got penalty
  allUsers: string[]; // All users who should participate
}

export interface CheckInRecord {
  id?: string;
  userId: string;
  sessionId: string;
  checkedInAt: Timestamp;
  expEarned: number;
}

export interface PenaltyRecord {
  id?: string;
  userId: string;
  sessionId: string;
  penaltyAppliedAt: Timestamp;
  expLost: number;
  reason: string;
}

/**
 * Generate QR code with scheduled time
 */
export const generateScheduledQR = async (
  title: string,
  description: string,
  startDateTime: Date,
  endDateTime: Date,
  expReward: number,
  penaltyExp: number,
  generatedBy: string,
  allUsers: string[] // All users who should participate
): Promise<string> => {
  try {
    // Create unique QR data
    const sessionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qrCodeData = `CHECKIN_${sessionId}`;

    const qrSession: Omit<QRSession, 'id'> = {
      title,
      description,
      startDateTime: Timestamp.fromDate(startDateTime),
      endDateTime: Timestamp.fromDate(endDateTime),
      qrCodeData,
      generatedBy,
      createdAt: Timestamp.now(),
      isActive: true,
      expReward,
      penaltyExp,
      allUsers,
      attendees: [],
      penalizedUsers: []
    };

    const docRef = await addDoc(collection(db, 'qrSessions'), qrSession);
    console.log('QR Session created with ID:', docRef.id);
   
    return qrCodeData;
  } catch (error) {
    console.error('Error generating scheduled QR:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Get active QR sessions (current or upcoming)
 */
export const getActiveQRSessions = async (): Promise<QRSession[]> => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'qrSessions'),
      where('isActive', '==', true),
      where('endDateTime', '>', now),
      orderBy('endDateTime'),
      orderBy('startDateTime')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QRSession));
  } catch (error) {
    console.error('Error fetching active QR sessions:', error);
    throw new Error('Failed to fetch QR sessions');
  }
};

/**
 * Get current available QR session for user
 */
export const getCurrentQRSession = async (userId: string): Promise<QRSession | null> => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'qrSessions'),
      where('isActive', '==', true),
      where('startDateTime', '<=', now),
      where('endDateTime', '>', now),
      orderBy('startDateTime', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const session = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as QRSession;

    // Check if user already checked in
    const hasCheckedIn = session.attendees.includes(userId);
    if (hasCheckedIn) return null;

    return session;
  } catch (error) {
    console.error('Error fetching current QR session:', error);
    throw new Error('Failed to fetch current session');
  }
};

/**
 * Validate QR and check-in user with proper XP handling
 */
export const validateAndCheckIn = async (qrData: string, userId: string): Promise<void> => {
  try {
    // Find the session by QR data
    const q = query(
      collection(db, 'qrSessions'),
      where('qrCodeData', '==', qrData),
      where('isActive', '==', true),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Invalid QR code');
    }

    const sessionDoc = querySnapshot.docs[0];
    const session = { id: sessionDoc.id, ...sessionDoc.data() } as QRSession;
    const now = Timestamp.now();

    // Check if session is currently active
    if (now.toMillis() < session.startDateTime.toMillis()) {
      throw new Error('Check-in session has not started yet');
    }

    if (now.toMillis() > session.endDateTime.toMillis()) {
      throw new Error('Check-in session has ended');
    }

    // Check if user already checked in
    if (session.attendees.includes(userId)) {
      throw new Error('You have already checked in for this session');
    }

    // Get user's current data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentExp = userData.exp || userData.experience || 0;
    const currentLevel = userData.level || 1;

    const batch = writeBatch(db);

    // Update session attendees
    const sessionRef = doc(db, 'qrSessions', session.id!);
    batch.update(sessionRef, {
      attendees: [...session.attendees, userId]
    });

    // Create check-in record
    const checkInRecord: Omit<CheckInRecord, 'id'> = {
      userId,
      sessionId: session.id!,
      checkedInAt: now,
      expEarned: session.expReward
    };
    const checkInRef = doc(collection(db, 'checkInRecords'));
    batch.set(checkInRef, checkInRecord);

    // Calculate new XP and level
    const newExp = currentExp + session.expReward;
    const newLevel = Math.floor(newExp / 100) + 1; // Every 100 XP = 1 level

    // Update user XP and level
    batch.update(userRef, {
      exp: newExp,
      experience: newExp, // Keep both for compatibility
      level: Math.max(currentLevel, newLevel),
      lastCheckIn: now,
      totalCheckIns: (userData.totalCheckIns || 0) + 1
    });

    await batch.commit();
    console.log(`Check-in successful for user: ${userId}, earned ${session.expReward} XP`);
  } catch (error) {
    console.error('Error during check-in:', error);
    throw error;
  }
};

/**
 * Get user's check-in status for current/today's sessions
 */
export const getUserCheckInStatus = async (userId: string): Promise<{
  hasCheckedIn: boolean;
  currentSession: QRSession | null;
  nextSession: QRSession | null;
  todayCheckIns: number;
}> => {
  try {
    const currentSession = await getCurrentQRSession(userId);
   
    // Check if user has checked in today (any session today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayQuery = query(
      collection(db, 'checkInRecords'),
      where('userId', '==', userId),
      where('checkedInAt', '>=', Timestamp.fromDate(today)),
      where('checkedInAt', '<', Timestamp.fromDate(tomorrow))
    );

    const todaySnapshot = await getDocs(todayQuery);
    const todayCheckIns = todaySnapshot.size;

    // Get next upcoming session
    const now = Timestamp.now();
    const nextQuery = query(
      collection(db, 'qrSessions'),
      where('isActive', '==', true),
      where('startDateTime', '>', now),
      orderBy('startDateTime'),
      limit(1)
    );

    const nextSnapshot = await getDocs(nextQuery);
    const nextSession = nextSnapshot.empty ? null : {
      id: nextSnapshot.docs[0].id,
      ...nextSnapshot.docs[0].data()
    } as QRSession;

    return {
      hasCheckedIn: false, // UBAH: Selalu false agar bisa check-in multiple kali
      currentSession,
      nextSession,
      todayCheckIns
    };
  } catch (error) {
    console.error('Error checking user status:', error);
    throw error;
  }
};

/**
 * Apply penalties for users who didn't check-in
 */
export const applyPenalties = async (sessionId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, 'qrSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
   
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const session = { id: sessionDoc.id, ...sessionDoc.data() } as QRSession;
   
    // Only apply penalties if session has ended
    const now = Timestamp.now();
    if (now.toMillis() <= session.endDateTime.toMillis()) {
      throw new Error('Session has not ended yet');
    }

    const batch = writeBatch(db);
    const penalizedUsers: string[] = [];

    // Apply penalties to all users who didn't check-in (excluding those already penalized)
    const missedUsers = session.allUsers.filter(
      userId => !session.attendees.includes(userId) && !session.penalizedUsers.includes(userId)
    );

    for (const userId of missedUsers) {
      // Get user's current data
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentExp = userData.exp || userData.experience || 0;
        const currentLevel = userData.level || 1;

        // Calculate new XP (don't go below 0)
        const newExp = Math.max(0, currentExp - session.penaltyExp);
        const newLevel = Math.max(1, Math.floor(newExp / 100) + 1); // Minimum level 1

        // Create penalty record
        const penaltyRecord: Omit<PenaltyRecord, 'id'> = {
          userId,
          sessionId,
          penaltyAppliedAt: now,
          expLost: Math.min(currentExp, session.penaltyExp), // Actual XP lost
          reason: `Missed check-in: ${session.title}`
        };
        const penaltyRef = doc(collection(db, 'penaltyRecords'));
        batch.set(penaltyRef, penaltyRecord);

        // Update user XP and level
        batch.update(userRef, {
          exp: newExp,
          experience: newExp, // Keep both for compatibility
          level: Math.min(currentLevel, newLevel), // Don't increase level from penalty
          totalPenalties: (userData.totalPenalties || 0) + 1,
          lastPenalty: now
        });

        penalizedUsers.push(userId);
      }
    }

    // Update session with penalized users
    batch.update(sessionRef, {
      penalizedUsers: [...session.penalizedUsers, ...penalizedUsers]
    });

    await batch.commit();
    console.log(`Penalties applied for session: ${sessionId}, penalized ${penalizedUsers.length} users`);
  } catch (error) {
    console.error('Error applying penalties:', error);
    throw error;
  }
};

/**
 * Get all QR sessions for admin
 */
export const getAllQRSessions = async (): Promise<QRSession[]> => {
  try {
    const q = query(
      collection(db, 'qrSessions'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QRSession));
  } catch (error) {
    console.error('Error fetching all QR sessions:', error);
    throw new Error('Failed to fetch QR sessions');
  }
};

/**
 * Deactivate QR session
 */
export const deactivateQRSession = async (sessionId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, 'qrSessions', sessionId);
    await updateDoc(sessionRef, {
      isActive: false
    });
  } catch (error) {
    console.error('Error deactivating session:', error);
    throw error;
  }
};

/**
 * Get check-in statistics for a session
 */
export const getSessionStats = async (sessionId: string): Promise<{
  totalAttendees: number;
  totalUsers: number;
  attendanceRate: number;
  penaltiesApplied: number;
}> => {
  try {
    const sessionRef = doc(db, 'qrSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
   
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const session = { id: sessionDoc.id, ...sessionDoc.data() } as QRSession;
   
    const totalAttendees = session.attendees.length;
    const totalUsers = session.allUsers.length;
    const attendanceRate = totalUsers > 0 ? (totalAttendees / totalUsers) * 100 : 0;
    const penaltiesApplied = session.penalizedUsers.length;

    return {
      totalAttendees,
      totalUsers,
      attendanceRate,
      penaltiesApplied
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    throw error;
  }
};


export const getTodayCheckInCount = async (): Promise<number> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set ke awal hari
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Set ke awal hari berikutnya

    const q = query(
      collection(db, 'checkInRecords'),
      where('checkedInAt', '>=', Timestamp.fromDate(today)),
      where('checkedInAt', '<', Timestamp.fromDate(tomorrow))
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting today's check-in count:", error);
    return 0;
  }
};
/**
 * Auto-apply penalties for ended sessions (to be called by cron job or scheduler)
 */
export const autoApplyPenaltiesForEndedSessions = async (): Promise<void> => {
  try {
    const now = Timestamp.now();
    
    // Get all sessions that have ended but penalties haven't been applied
    const q = query(
      collection(db, 'qrSessions'),
      where('isActive', '==', true),
      where('endDateTime', '<', now)
    );

    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      const session = { id: doc.id, ...doc.data() } as QRSession;
      
      // Apply penalties if there are users and not all have been penalized
      if (session.allUsers && session.allUsers.length > 0) {
        const missedUsers = session.allUsers.filter(
          userId => !session.attendees.includes(userId) && !session.penalizedUsers.includes(userId)
        );
        
        if (missedUsers.length > 0) {
          await applyPenalties(session.id!);
        }
      }
      
      // Deactivate the session
      await deactivateQRSession(session.id!);
    }
    
    console.log('Auto-applied penalties for ended sessions');
  } catch (error) {
    console.error('Error auto-applying penalties:', error);
    throw error;
  }
};

/**
 * Get user's check-in history
 */
export const getUserCheckInHistory = async (userId: string, limitCount: number = 10): Promise<CheckInRecord[]> => {
  try {
    const q = query(
      collection(db, 'checkInRecords'),
      where('userId', '==', userId),
      orderBy('checkedInAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CheckInRecord));
  } catch (error) {
    console.error('Error fetching user check-in history:', error);
    throw error;
  }
};

/**
 * Get user's penalty history
 */
export const getUserPenaltyHistory = async (userId: string, limitCount: number = 10): Promise<PenaltyRecord[]> => {
  try {
    const q = query(
      collection(db, 'penaltyRecords'),
      where('userId', '==', userId),
      orderBy('penaltyAppliedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PenaltyRecord));
  } catch (error) {
    console.error('Error fetching user penalty history:', error);
    throw error;
  }
};

// Tambahkan fungsi-fungsi ini ke qrService.ts

/**
 * Get all user IDs (basic version)
 */
export const getAllUserIds = async (): Promise<string[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching user IDs:', error);
    return [];
  }
};

/**
 * Get all users with basic info (lebih informatif untuk admin)
 */
export const getAllUsersBasicInfo = async (): Promise<Array<{
  uid: string;
  name: string;
  email: string;
  level: number;
  exp: number;
  isActive?: boolean;
}>> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || data.displayName || 'Unknown User',
        email: data.email || 'No email',
        level: data.level || 1,
        exp: data.exp || data.experience || 0,
        isActive: data.isActive !== false // default true jika tidak ada field
      };
    });
  } catch (error) {
    console.error('Error fetching users basic info:', error);
    return [];
  }
};

/**
 * Get active users only (yang bisa kena penalty)
 */
export const getActiveUserIds = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isActive', '!=', false) // Ambil user yang active atau tidak ada field isActive
    );
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching active user IDs:', error);
    // Fallback ke semua user jika query gagal
    return getAllUserIds();
  }
};

/**
 * Get users by role/level (jika ada sistem role)
 */
export const getUsersByRole = async (role?: string, minLevel?: number): Promise<string[]> => {
  try {
    let q = query(collection(db, 'users'));
    
    // Filter berdasarkan role jika ada
    if (role) {
      q = query(q, where('role', '==', role));
    }
    
    // Filter berdasarkan level minimum jika ada
    if (minLevel) {
      q = query(q, where('level', '>=', minLevel));
    }
    
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching users by criteria:', error);
    return [];
  }
};

/**
 * Helper untuk mendapatkan user berdasarkan berbagai kriteria
 */
export const getUsersByFilter = async (filter: {
  includeInactive?: boolean;
  role?: string;
  minLevel?: number;
  maxLevel?: number;
  specificUsers?: string[];
}): Promise<string[]> => {
  try {
    // Jika ada specific users, return langsung
    if (filter.specificUsers && filter.specificUsers.length > 0) {
      return filter.specificUsers;
    }

    let q = query(collection(db, 'users'));
    
    // Filter aktif/tidak aktif
    if (!filter.includeInactive) {
      q = query(q, where('isActive', '!=', false));
    }
    
    // Filter role
    if (filter.role) {
      q = query(q, where('role', '==', filter.role));
    }
    
    // Filter level
    if (filter.minLevel) {
      q = query(q, where('level', '>=', filter.minLevel));
    }
    if (filter.maxLevel) {
      q = query(q, where('level', '<=', filter.maxLevel));
    }
    
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching users by filter:', error);
    return [];
  }
};

/**
 * Generate QR dengan helper untuk auto-select users
 */
export const generateScheduledQRWithAutoUsers = async (
  title: string,
  description: string,
  startDateTime: Date,
  endDateTime: Date,
  expReward: number,
  penaltyExp: number,
  generatedBy: string,
  userFilter: {
    useAllUsers?: boolean;
    useActiveOnly?: boolean;
    role?: string;
    minLevel?: number;
    maxLevel?: number;
    specificUsers?: string[];
  } = { useActiveOnly: true }
): Promise<string> => {
  try {
    let allUsers: string[] = [];

    if (userFilter.useAllUsers) {
      allUsers = await getAllUserIds();
    } else {
      allUsers = await getUsersByFilter({
        includeInactive: !userFilter.useActiveOnly,
        role: userFilter.role,
        minLevel: userFilter.minLevel,
        maxLevel: userFilter.maxLevel,
        specificUsers: userFilter.specificUsers
      });
    }

    if (allUsers.length === 0) {
      throw new Error('No users found with the specified criteria');
    }

    return await generateScheduledQR(
      title,
      description,
      startDateTime,
      endDateTime,
      expReward,
      penaltyExp,
      generatedBy,
      allUsers
    );
  } catch (error) {
    console.error('Error generating QR with auto users:', error);
    throw error;
  }
};

/**
 * Preview users yang akan terkena dampak sebelum membuat QR
 */
export const previewAffectedUsers = async (filter: {
  includeInactive?: boolean;
  role?: string;
  minLevel?: number;
  maxLevel?: number;
  specificUsers?: string[];
}): Promise<{
  totalUsers: number;
  users: Array<{
    uid: string;
    name: string;
    email: string;
    level: number;
    exp: number;
  }>;
}> => {
  try {
    const userIds = await getUsersByFilter(filter);
    const usersInfo = await getAllUsersBasicInfo();
    
    const filteredUsers = usersInfo.filter(user => userIds.includes(user.uid));
    
    return {
      totalUsers: filteredUsers.length,
      users: filteredUsers
    };
  } catch (error) {
    console.error('Error previewing affected users:', error);
    return { totalUsers: 0, users: [] };
  }
};
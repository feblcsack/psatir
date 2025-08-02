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
  requiredUsers?: string[]; // Optional: specific users who must check-in
  attendees: string[]; // Users who checked in
  penalizedUsers: string[]; // Users who got penalty
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
  requiredUsers?: string[]
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
      requiredUsers: requiredUsers || [],
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
 * Validate QR and check-in user
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

    // Update user EXP
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentExp = userDoc.data().experience || 0;
      batch.update(userRef, {
        experience: currentExp + session.expReward
      });
    }

    await batch.commit();
    console.log('Check-in successful for user:', userId);
  } catch (error) {
    console.error('Error during check-in:', error);
    throw error;
  }
};

/**
 * Get user's check-in status for current session
 */
export const getUserCheckInStatus = async (userId: string): Promise<{
  hasCheckedIn: boolean;
  currentSession: QRSession | null;
  nextSession: QRSession | null;
}> => {
  try {
    const currentSession = await getCurrentQRSession(userId);
    
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
      hasCheckedIn: currentSession === null,
      currentSession,
      nextSession
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

    // If specific users are required, penalize those who didn't check-in
    if (session.requiredUsers && session.requiredUsers.length > 0) {
      const missedUsers = session.requiredUsers.filter(
        userId => !session.attendees.includes(userId) && !session.penalizedUsers.includes(userId)
      );

      for (const userId of missedUsers) {
        // Create penalty record
        const penaltyRecord: Omit<PenaltyRecord, 'id'> = {
          userId,
          sessionId,
          penaltyAppliedAt: now,
          expLost: session.penaltyExp,
          reason: `Missed mandatory check-in: ${session.title}`
        };
        const penaltyRef = doc(collection(db, 'penaltyRecords'));
        batch.set(penaltyRef, penaltyRecord);

        // Update user EXP
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentExp = Math.max(0, (userDoc.data().experience || 0) - session.penaltyExp);
          batch.update(userRef, {
            experience: currentExp
          });
        }

        penalizedUsers.push(userId);
      }
    }

    // Update session with penalized users
    batch.update(sessionRef, {
      penalizedUsers: [...session.penalizedUsers, ...penalizedUsers]
    });

    await batch.commit();
    console.log('Penalties applied for session:', sessionId);
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
  totalRequired: number;
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
    const totalRequired = session.requiredUsers?.length || 0;
    const attendanceRate = totalRequired > 0 ? (totalAttendees / totalRequired) * 100 : 0;
    const penaltiesApplied = session.penalizedUsers.length;

    return {
      totalAttendees,
      totalRequired,
      attendanceRate,
      penaltiesApplied
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    throw error;
  }
};
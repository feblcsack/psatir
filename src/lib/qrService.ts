import { 
    doc, 
    setDoc, 
    getDoc, 
    addDoc, 
    collection,
    query,
    where,
    getDocs 
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  export interface CheckInData {
    date: string; // YYYYMMDD format
    qrCodeData: string;
    generatedAt: Date;
    generatedBy: string;
  }
  
  export interface CheckInRecord {
    userId: string;
    checkedAt: Date;
    expBonus: number;
  }
  
  export const generateDailyQR = async (adminId: string): Promise<string> => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      
      // Generate random QR data
      const qrData = `PSATIR_CHECKIN_${dateStr}_${Math.random().toString(36).substring(2, 15)}`;
      
      const checkInData: CheckInData = {
        date: dateStr,
        qrCodeData: qrData,
        generatedAt: today,
        generatedBy: adminId
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'checkIns', dateStr), checkInData);
      
      return qrData;
    } catch (error) {
      throw error;
    }
  };
  
  export const getTodayQR = async (): Promise<CheckInData | null> => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      
      const docRef = doc(db, 'checkIns', dateStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as CheckInData;
      }
      return null;
    } catch (error) {
      console.error('Error getting today QR:', error);
      return null;
    }
  };
  
  export const validateAndCheckIn = async (scannedData: string, userId: string): Promise<boolean> => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      
      // Get today's QR data
      const checkInDoc = await getDoc(doc(db, 'checkIns', dateStr));
      
      if (!checkInDoc.exists()) {
        throw new Error('No QR code generated for today');
      }
      
      const checkInData = checkInDoc.data() as CheckInData;
      
      // Validate QR data
      if (checkInData.qrCodeData !== scannedData) {
        throw new Error('Invalid QR code');
      }
      
      // Check if user already checked in today
      const recordsQuery = query(
        collection(db, 'checkIns', dateStr, 'records'),
        where('userId', '==', userId)
      );
      const existingRecords = await getDocs(recordsQuery);
      
      if (!existingRecords.empty) {
        throw new Error('Already checked in today');
      }
      
      // Create check-in record
      const expBonus = 10; // 10 EXP for daily check-in
      const record: CheckInRecord = {
        userId,
        checkedAt: today,
        expBonus
      };
      
      await addDoc(collection(db, 'checkIns', dateStr, 'records'), record);
      
      // Update user EXP
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (userData) {
        const newExp = userData.exp + expBonus;
        const newLevel = Math.floor(newExp / 100) + 1;
        
        await setDoc(userRef, {
          ...userData,
          exp: newExp,
          level: newLevel
        });
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };
  
  export const getUserCheckInStatus = async (userId: string): Promise<boolean> => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const recordsQuery = query(
        collection(db, 'checkIns', dateStr, 'records'),
        where('userId', '==', userId)
      );
      const records = await getDocs(recordsQuery);
      
      return !records.empty;
    } catch (error) {
      console.error('Error checking user check-in status:', error);
      return false;
    }
  };
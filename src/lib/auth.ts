import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    User 
  } from 'firebase/auth';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import { auth, db } from './firebase';
  
  export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    exp: number;
    level: number;
    createdAt: Date;
  }
  
  export const signUp = async (email: string, password: string, name: string, role: 'user' | 'admin') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        name,
        email,
        role,
        exp: 0,
        level: 1,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return { user, profile: userProfile };
    } catch (error) {
      throw error;
    }
  };
  
  export const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const profile = userDoc.data() as UserProfile;
      
      return { user, profile };
    } catch (error) {
      throw error;
    }
  };
  
  export const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };
  
  export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };
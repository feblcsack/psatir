import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {

    apiKey: "AIzaSyD-U-s2lmYrUjY4sJ2_9erE4tOIvv3cIEU",
  
    authDomain: "psatir-37a24.firebaseapp.com",
  
    projectId: "psatir-37a24",
  
    storageBucket: "psatir-37a24.firebasestorage.app",
  
    messagingSenderId: "256227086119",
  
    appId: "1:256227086119:web:6e63db7e4f14380b4c6302"
  
  };
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
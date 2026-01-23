// src/test/firebaseTest.ts
import { auth, db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore
    const testCollection = collection(db, 'users');
    const snapshot = await getDocs(testCollection);
    console.log('✅ Firestore connected. Users count:', snapshot.size);
    
    // Test Auth
    console.log('✅ Auth initialized:', auth.app.name);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}
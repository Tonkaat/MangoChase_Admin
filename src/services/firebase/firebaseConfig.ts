// src/services/firebase/firebase-config.ts
import { 
  db, 
  auth, 
  storage 
} from '../../config/firebase';
import { 
  Timestamp, 
  serverTimestamp, 
  FieldValue,
  writeBatch,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  addDoc,
  setDoc, // Make sure this is exported
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';

// Re-export your existing Firebase instances
export { db, auth, storage };

// Export Firebase Firestore utilities
export { 
  Timestamp, 
  serverTimestamp, 
  FieldValue,
  writeBatch,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  addDoc,
  setDoc, // This was missing
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction
};

// Type exports for consistency
export type DocumentSnapshot = any;
export type QuerySnapshot = any;
export type Unsubscribe = () => void;
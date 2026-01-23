// src/services/userService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  farmId?: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    notifications?: boolean;
    language?: string;
    theme?: 'light' | 'dark';
  };
}

class UserService {
  async getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      uid: userDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as User;
  }

  async getUsersByFarm(farmId: string): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('farmId', '==', farmId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as User[];
  }

  async getUsersByRole(farmId: string, role: string): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('farmId', '==', farmId),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as User[];
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async updateUserSettings(uid: string, settings: User['settings']): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      settings,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteUser(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  }

  async getAllUsers(): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as User[];
  }
}

export const userService = new UserService();
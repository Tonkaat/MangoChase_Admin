import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  farmId?: string;
  assignedClusters?: string[]; // cluster IDs assigned to this user
  settings?: UserSettings;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface UserSettings {
  notifications?: boolean;
  darkMode?: boolean;
  businessMode?: boolean;
  hasCompletedSetup?: boolean;
  [key: string]: any;
}

export class UserService {

  async createUserProfile(options: {
    name: string;
    email: string;
    role: string;
    farmId: string;
    assignedClusters?: string[];
    settings?: UserSettings;
  }): Promise<void> {
    const { name, email, role, farmId, assignedClusters, settings } = options;
    const userId = auth.currentUser?.uid;

    if (!userId) throw new Error('No user logged in');

    await setDoc(doc(db, 'users', userId), {
      name,
      email,
      role,
      farmId,
      assignedClusters: assignedClusters || [],
      settings: settings || {
        notifications: true,
        darkMode: false,
        businessMode: false,
      },
      createdAt: serverTimestamp(),
    });
  }

  async upsertUserProfile(options: {
    name: string;
    email: string;
    role: string;
    farmId?: string;
    assignedClusters?: string[];
    settings?: UserSettings;
    additionalData?: Record<string, any>;
  }): Promise<void> {
    const { name, email, role, farmId, assignedClusters, settings, additionalData } = options;

    let user = auth.currentUser;
    let retries = 3;

    while (!user && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      user = auth.currentUser;
      retries--;
    }

    if (!user) throw new Error('No user logged in. Please try signing in again.');

    const userId = user.uid;

    const userData: Record<string, any> = {
      name,
      email,
      role,
      farmId: farmId || '',
      assignedClusters: assignedClusters || [],
      settings: settings || {
        notifications: true,
        darkMode: false,
        businessMode: false,
        hasCompletedSetup: false,
      },
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, { ...userData, createdAt: serverTimestamp() });
    } else {
      await setDoc(userRef, userData, { merge: true });
    }
  }

  async updateUserProfile(updates: Record<string, any>): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    await updateDoc(doc(db, 'users', userId), updates);
  }

  async updateUserSettings(settings: UserSettings): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    await updateDoc(doc(db, 'users', userId), { settings });
  }

  async updateAssignedClusters(clusterIds: string[]): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    await updateDoc(doc(db, 'users', userId), {
      assignedClusters: clusterIds,
      updatedAt: serverTimestamp(),
    });
  }

  async getUserProfile(): Promise<Record<string, any> | null> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;

    return { id: userDoc.id, ...userDoc.data() };
  }

  getUserProfileStream(callback: (data: Record<string, any> | null) => void): () => void {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');

    const userRef = doc(db, 'users', userId);

    return onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          callback({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in user profile stream:', error);
        callback(null);
      }
    );
  }

  async getCurrentUserFarmId(): Promise<string | null> {
    try {
      const userProfile = await this.getUserProfile();
      return userProfile?.farmId || null;
    } catch (error) {
      console.error('Error getting user farm ID:', error);
      return null;
    }
  }

  async getCurrentUserClusters(): Promise<string[]> {
    try {
      const userProfile = await this.getUserProfile();
      return userProfile?.assignedClusters || [];
    } catch (error) {
      console.error('Error getting user clusters:', error);
      return [];
    }
  }

  async getUserById(userId: string): Promise<Record<string, any> | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUsersByCluster(clusterId: string): Promise<Record<string, any>[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('assignedClusters', 'array-contains', clusterId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error getting users by cluster:', error);
      return [];
    }
  }

  async userExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  //new
  async getUsersByFarm(farmId: string): Promise<Record<string, any>[]> {
    try {
      const q = query(collection(db, 'users'), where('farmId', '==', farmId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error getting users by farm:', error);
      return [];
    }
  }
}

export const userService = new UserService();
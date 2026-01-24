// src/services/firebase/user-service.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  onSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  farmId?: string;
  settings?: UserSettings;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any; // For additionalData
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
    settings?: UserSettings;
  }): Promise<void> {
    const { name, email, role, farmId, settings } = options;
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    console.log('📝 UserService.createUserProfile - userId:', userId);

    await setDoc(doc(db, 'users', userId), {
      name,
      email,
      role,
      farmId,
      settings: settings || {
        notifications: true,
        darkMode: false,
        businessMode: false,
      },
      createdAt: serverTimestamp(),
    });

    console.log('✅ User profile created for:', userId);
  }

  async upsertUserProfile(options: {
    name: string;
    email: string;
    role: string;
    farmId?: string;
    settings?: UserSettings;
    additionalData?: Record<string, any>;
  }): Promise<void> {
    const { name, email, role, farmId, settings, additionalData } = options;
    
    let user = auth.currentUser;
    let retries = 3;
    
    // ⚠️ EXACT SAME RETRY LOGIC AS FLUTTER!
    while (!user && retries > 0) {
      console.log('⏳ Waiting for auth state... retries left:', retries);
      await new Promise(resolve => setTimeout(resolve, 500));
      user = auth.currentUser;
      retries--;
    }
    
    if (!user) {
      console.error('❌ No user after retries, current auth state:', auth.currentUser);
      throw new Error('No user logged in. Please try signing in again.');
    }

    const userId = user.uid;
    console.log('✅ Using user ID:', userId, 'for profile upsert');

    const userData: Record<string, any> = {
      name,
      email,
      role,
      farmId: farmId || '',
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
      // Create new document
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
      });
      console.log('✅ Created new user profile for:', userId);
    } else {
      // Update existing document (merge)
      await setDoc(userRef, userData, { merge: true });
      console.log('✅ Updated existing user profile for:', userId);
    }
  }

  async updateUserProfile(updates: Record<string, any>): Promise<void> {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    await updateDoc(doc(db, 'users', userId), updates);
    console.log('✅ User profile updated for:', userId);
  }

  async updateUserSettings(settings: UserSettings): Promise<void> {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    await updateDoc(doc(db, 'users', userId), {
      settings: settings,
    });
    console.log('✅ User settings updated for:', userId);
  }

  async getUserProfile(): Promise<Record<string, any> | null> {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  }

  // ⚠️ EXACT SAME STREAM PATTERN AS FLUTTER!
  getUserProfileStream(callback: (data: Record<string, any> | null) => void): () => void {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    const userRef = doc(db, 'users', userId);
    
    return onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };
        callback(data);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in user profile stream:', error);
      callback(null);
    });
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

  // Additional helper method (if needed)
  async getUserById(userId: string): Promise<Record<string, any> | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Optional: Check if user exists
  async userExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
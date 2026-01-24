// src/services/authService.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  farmId?: string;
  createdAt: Date;
  settings?: Record<string, any>;
}

class AuthService {
  async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async signUp(email: string, password: string, name: string, role: string = 'admin'): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update display name
    await updateProfile(user, { displayName: name });

    // Create user profile in Firestore
    await this.createUserProfile({
      uid: user.uid,
      name,
      email,
      role: role as any,
      createdAt: new Date(),
    });

    return user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

async createUserProfile(profile: Omit<UserProfile, 'uid'> & { uid: string }): Promise<void> {
  const userRef = doc(db, 'users', profile.uid);
  await setDoc(userRef, {
    ...profile,
    farmId: profile.farmId || '', // Match Flutter's structure
    settings: profile.settings || {
      notifications: true,
      darkMode: false,
      businessMode: false,
      hasCompletedSetup: false,
    },
    createdAt: profile.createdAt.toISOString(),
  });
}

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      uid: userDoc.id,
      ...data,
      createdAt: new Date(data.createdAt),
    } as UserProfile;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updates, { merge: true });
  }
}

export const authService = new AuthService();
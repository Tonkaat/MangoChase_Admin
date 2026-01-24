// src/services/firebase/firebaseAuthService.ts
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User  // ✅ Use Firebase's User type
} from 'firebase/auth';
import { auth } from '../../config/firebase';

export class FirebaseAuthService {
  
  async signIn(email: string, password: string): Promise<User | null> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user; // ✅ Return Firebase User directly
    } catch (error: any) {
      throw this.handleAuthException(error);
    }
  }

  async signUp(email: string, password: string): Promise<User | null> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return credential.user; // ✅ Return Firebase User directly
    } catch (error: any) {
      throw this.handleAuthException(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser; // ✅ Return Firebase User directly
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthException(error);
    }
  }

  // ⚠️ EXACT SAME ERROR HANDLING AS FLUTTER!
  private handleAuthException(error: any): string {
    const code = error.code;
    
    switch (code) {
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Wrong password provided.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email.';
      case 'auth/invalid-email':
        return 'The email address is invalid.';
      case 'auth/weak-password':
        return 'The password is too weak.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return `Authentication error: ${error.message || 'Unknown error'}`;
    }
  }
}

// ✅ NO CUSTOM User interface! Use Firebase's User instead
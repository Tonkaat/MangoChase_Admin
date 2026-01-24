// src/services/authService.ts
import { FirebaseAuthService } from './firebase/firebaseAuthService';
import { userService } from './firebase/userService';
import { farmService } from './firebase/farmService';
import { User } from 'firebase/auth'; // ✅ Import from Firebase

// Your custom types for user profile and farm data
export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  farmId: string;
  settings?: {
    notifications: boolean;
    darkMode: boolean;
    businessMode: boolean;
    hasCompletedSetup: boolean;
  };
  [key: string]: any;
}

export interface FarmData {
  farmId: string;
  name: string;
  location: string;
  farmSize: number;
  numberOfTrees: number;
  cropType: string;
  farmingType: string;
  ownerId: string;
  [key: string]: any;
}

export interface SetupData {
  farmName: string;
  farmLocation: string;
  farmSize: number;
  numberOfTrees: number;
  cropType: string;
  farmingType: string;
}

class AuthService {
  private firebaseAuth = new FirebaseAuthService();
  private currentUser: User | null = null; // ✅ Use Firebase User
  private currentUserProfile: UserProfile | null = null;
  private currentFarmId: string | null = null;
  private currentFarmData: FarmData | null = null;
  private isLoading = false;
  private isInitialized = false;

  // Initialize auth state
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.isLoading = true;
    
    try {
      this.currentUser = this.firebaseAuth.getCurrentUser();
      
      if (this.currentUser) {
        await this.loadUserData();
        await this.saveSessionLocally();
      } else {
        await this.tryRestoreLocalSession();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.isInitialized = true;
      this.isLoading = false;
    }
  }

  // Load user data
  private async loadUserData(): Promise<void> {
    if (!this.currentUser) return;

    // Clear previous data
    this.currentUserProfile = null;
    this.currentFarmId = null;
    this.currentFarmData = null;

    try {
      const profile = await userService.getUserProfile();
      
      if (profile) {
        this.currentUserProfile = profile as UserProfile;
        this.currentFarmId = this.currentUserProfile.farmId || null;
        
        // Load farm data if farmId exists
        if (this.currentFarmId && this.currentFarmId.trim() !== '') {
          try {
            const farm = await farmService.getFarmProfile(this.currentFarmId);
            if (farm) {
              this.currentFarmData = farm as FarmData;
            }
          } catch (error) {
            console.error('Error loading farm data:', error);
          }
        }
      } else {
        console.log('User profile not found, might be Google sign-in user');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Save session locally
  private async saveSessionLocally(): Promise<void> {
    try {
      const userId = this.currentUser?.uid || '';
      
      // Clear previous session keys
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('has_completed_setup_') || 
        key === 'userId' || 
        key === 'userEmail' || 
        key === 'farmId' || 
        key === 'isAuthenticated'
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Save new session data
      localStorage.setItem('userId', userId);
      localStorage.setItem('userEmail', this.currentUser?.email || '');
      localStorage.setItem('farmId', this.currentFarmId || '');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem(`has_completed_setup_${userId}`, this.hasCompletedSetup.toString());
    } catch (error) {
      console.error('Error saving session locally:', error);
    }
  }

  // Try to restore local session
  private async tryRestoreLocalSession(): Promise<void> {
    try {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      if (isAuthenticated) {
        this.currentUser = this.firebaseAuth.getCurrentUser();
        if (this.currentUser) {
          await this.loadUserData();
        } else {
          await this.clearLocalSession();
        }
      }
    } catch (error) {
      console.error('Error restoring local session:', error);
      await this.clearLocalSession();
    }
  }

  // Clear local session
  private async clearLocalSession(): Promise<void> {
    try {
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('has_completed_setup_') || 
        key === 'userId' || 
        key === 'userEmail' || 
        key === 'farmId' || 
        key === 'isAuthenticated' ||
        key === 'saved_username'
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing local session:', error);
    }
  }

  // Getters
  get user(): User | null {
    return this.currentUser;
  }

  get userProfile(): UserProfile | null {
    return this.currentUserProfile;
  }

  get farmId(): string | null {
    return this.currentFarmId;
  }

  get farmData(): FarmData | null {
    return this.currentFarmData;
  }

  get loading(): boolean {
    return this.isLoading;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  get authenticated(): boolean {
    return this.currentUser !== null;
  }

  get hasCompletedSetup(): boolean {
    if (!this.currentUserProfile) return false;
    
    if (this.currentUserProfile.settings?.hasCompletedSetup === true) {
      return true;
    }
    
    return this.currentUserProfile.hasCompletedSetup || false;
  }

  // Auth methods
  async signIn(email: string, password: string): Promise<User> {
    this.isLoading = true;
    
    try {
      // Clear previous session
      await this.clearLocalSession();
      this.currentUserProfile = null;
      this.currentFarmId = null;
      this.currentFarmData = null;
      
      this.currentUser = await this.firebaseAuth.signIn(email, password);
      
      if (this.currentUser) {
        await this.loadUserData();
        await this.saveSessionLocally();
      }
      
      return this.currentUser;
    } catch (error) {
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    this.isLoading = true;
    
    try {
      // Clear previous session
      await this.clearLocalSession();
      this.currentUserProfile = null;
      this.currentFarmId = null;
      this.currentFarmData = null;
      
      this.currentUser = await this.firebaseAuth.signUp(email, password);
      
      if (this.currentUser) {
        await userService.createUserProfile({
          name: name,
          email: email,
          role: 'farmer',
          farmId: '',
          settings: {
            notifications: true,
            darkMode: false,
            businessMode: false,
            hasCompletedSetup: false,
          },
        });
        
        await this.loadUserData();
        await this.saveSessionLocally();
      }
      
      return this.currentUser;
    } catch (error) {
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.firebaseAuth.signOut();
      await this.clearLocalSession();
      
      this.currentUser = null;
      this.currentUserProfile = null;
      this.currentFarmId = null;
      this.currentFarmData = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    await this.firebaseAuth.resetPassword(email);
  }

  async completeSetup(setupData: SetupData): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in. Please sign in again.');
    }

    this.isLoading = true;
    
    try {
      const farmId = await farmService.createOrUpdateFarmProfile({
        name: setupData.farmName,
        location: setupData.farmLocation,
        farmSize: setupData.farmSize,
        numberOfTrees: setupData.numberOfTrees,
        cropType: setupData.cropType,
        farmingType: setupData.farmingType,
        ownerId: this.currentUser.uid,
      });
      
      await userService.upsertUserProfile({
        name: this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'User',
        email: this.currentUser.email || '',
        role: 'farmer',
        farmId: farmId,
        settings: {
          notifications: true,
          darkMode: false,
          businessMode: false,
          hasCompletedSetup: true,
        },
        additionalData: {
          farmSize: setupData.farmSize,
          numberOfTrees: setupData.numberOfTrees,
          cropType: setupData.cropType,
          farmingType: setupData.farmingType,
          hasCompletedSetup: true,
          setupCompletedAt: new Date().toISOString(),
        },
      });
      
      await this.loadUserData();
      await this.saveSessionLocally();
    } catch (error) {
      console.error('Error in completeSetup:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async refreshUserData(): Promise<void> {
    const previousUser = this.currentUser;
    this.currentUser = this.firebaseAuth.getCurrentUser();
    
    // If user changed, clear cached data
    if (this.currentUser?.uid !== previousUser?.uid) {
      this.currentUserProfile = null;
      this.currentFarmId = null;
      this.currentFarmData = null;
    }
    
    if (this.currentUser) {
      await this.loadUserData();
    }
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    await userService.updateUserSettings(settings);
    await this.refreshUserData();
  }

  async getFarmStatistics(): Promise<Record<string, any>> {
    if (!this.currentFarmId || this.currentFarmId.trim() === '') {
      throw new Error('No farm ID available');
    }
    return await farmService.getStatistics(this.currentFarmId);
  }

  async getCurrentFarmId(): Promise<string | null> {
    if (!this.authenticated) return null;
    
    try {
      const profile = await userService.getUserProfile();
      return profile?.farmId || null;
    } catch (error) {
      console.error('Error getting farmId:', error);
      return null;
    }
  }

  // Get user profile by ID (for your auth provider)
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await userService.getUserById(userId);
      return profile as UserProfile | null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Ensure Google user profile exists
  async ensureGoogleUserProfile(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const profile = await userService.getUserProfile();
      
      if (!profile) {
        await userService.upsertUserProfile({
          name: this.currentUser.displayName || this.currentUser.email?.split('@')[0] || 'User',
          email: this.currentUser.email || '',
          role: 'farmer',
          farmId: '',
          settings: {
            notifications: true,
            darkMode: false,
            businessMode: false,
            hasCompletedSetup: false,
          },
          additionalData: {
            authProvider: 'google',
          },
        });
        
        await this.loadUserData();
      }
    } catch (error) {
      console.error('Error ensuring Google user profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Optional: Initialize on module load
authService.initialize().catch(console.error);
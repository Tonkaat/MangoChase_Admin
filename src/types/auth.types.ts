// src/types/auth.ts
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  farmId: string;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    businessMode: boolean;
    hasCompletedSetup: boolean;
  };
  additionalData?: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
}

export interface FarmData {
  id: string;
  name: string;
  location: string;
  farmSize: number;
  numberOfTrees: number;
  cropType: string;
  farmingType: string;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
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

export interface AuthState {
  user: User | null;
  farmId: string | null;
  userProfile: UserProfile | null;
  farmData: FarmData | null;
  isLoading: boolean;
  isInitialized: boolean;
}
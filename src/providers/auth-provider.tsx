// src/providers/auth-provider.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { authService, UserProfile, FarmData } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  farmId: string | null;
  farmData: FarmData | null;
  loading: boolean;
  initialized: boolean;
  authenticated: boolean;
  hasCompletedSetup: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeSetup: (setupData: any) => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  getFarmStatistics: () => Promise<any>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('🔥 AuthProvider - Setting up onAuthStateChanged listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      console.log('🔥 onAuthStateChanged fired - User:', firebaseUser?.uid || 'NULL');
      
      if (firebaseUser) {
        try {
          console.log('👤 User detected, initializing authService...');
          
          // Wait for auth service to initialize with timeout
          if (!authService.initialized) {
            console.log('⏰ AuthService not initialized, calling initialize()...');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AuthService initialization timeout')), 10000)
            );
            
            await Promise.race([
              authService.initialize(),
              timeoutPromise
            ]);
            
            console.log('✅ AuthService initialized successfully');
          }
          
          console.log('📊 Setting user state from authService');
          setUser(authService.user);
          setUserProfile(authService.userProfile);
          setFarmId(authService.farmId);
          setFarmData(authService.farmData);
          setInitialized(authService.initialized);
          
          console.log('✅ Auth state updated:', {
            userId: authService.user?.uid,
            hasProfile: !!authService.userProfile,
            farmId: authService.farmId,
            hasFarmData: !!authService.farmData
          });
          
        } catch (error) {
          console.error('❌ Error initializing authService:', error);
          
          // Fallback: Set user even if authService fails
          setUser(firebaseUser);
          setUserProfile(null);
          setFarmId(null);
          setFarmData(null);
          setInitialized(true);
        }
      } else {
        console.log('❌ No user detected, clearing auth state');
        setUser(null);
        setUserProfile(null);
        setFarmId(null);
        setFarmData(null);
        setInitialized(true);
      }
      
      console.log('🏁 Setting loading = false');
      setLoading(false);
    });

    return () => {
      console.log('🔥 AuthProvider - Cleaning up listener');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 signIn called');
    setLoading(true);
    try {
      const user = await authService.signIn(email, password);
      console.log('✅ signIn successful:', user?.uid);
      setUser(user);
      setUserProfile(authService.userProfile);
      setFarmId(authService.farmId);
      setFarmData(authService.farmData);
    } catch (error) {
      console.error('❌ signIn error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('📝 signUp called');
    setLoading(true);
    try {
      const user = await authService.signUp(email, password, name);
      console.log('✅ signUp successful:', user?.uid);
      setUser(user);
      setUserProfile(authService.userProfile);
      setFarmId(authService.farmId);
      setFarmData(authService.farmData);
    } catch (error) {
      console.error('❌ signUp error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 signOut called');
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      setFarmId(null);
      setFarmData(null);
    } catch (error) {
      console.error('❌ signOut error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔑 resetPassword called');
    await authService.resetPassword(email);
  };

  const completeSetup = async (setupData: any) => {
    console.log('✨ completeSetup called');
    setLoading(true);
    try {
      await authService.completeSetup(setupData);
      setUserProfile(authService.userProfile);
      setFarmId(authService.farmId);
      setFarmData(authService.farmData);
      console.log('✅ Setup completed');
    } catch (error) {
      console.error('❌ completeSetup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    console.log('🔄 refreshUserData called');
    await authService.refreshUserData();
    setUser(authService.user);
    setUserProfile(authService.userProfile);
    setFarmId(authService.farmId);
    setFarmData(authService.farmData);
  };

  const updateSettings = async (settings: any) => {
    console.log('⚙️ updateSettings called');
    await authService.updateSettings(settings);
    setUserProfile(authService.userProfile);
  };

  const getFarmStatistics = async () => {
    console.log('📊 getFarmStatistics called');
    return await authService.getFarmStatistics();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    farmId,
    farmData,
    loading: loading || !initialized,
    initialized,
    authenticated: !!user,
    hasCompletedSetup: authService.hasCompletedSetup,
    signIn,
    signUp,
    signOut,
    resetPassword,
    completeSetup,
    refreshUserData,
    updateSettings,
    getFarmStatistics,
  };

  console.log('🎯 AuthProvider render - loading:', loading || !initialized, 'user:', user?.uid || 'NULL');

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
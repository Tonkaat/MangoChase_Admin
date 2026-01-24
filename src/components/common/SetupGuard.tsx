// src/components/common/SetupGuard.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { firebaseService } from '@/services/firebase';
import { LoadingSpinner } from './LoadingSpinner';

interface SetupGuardProps {
  children: React.ReactNode;
  requireSetup?: boolean;
}

export function SetupGuard({ children, requireSetup = false }: SetupGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log('🚀🚀🚀 SETUPGUARD MOUNTED 🚀🚀🚀');
    console.log('📍 Location:', location.pathname);
    console.log('🎯 requireSetup prop:', requireSetup);
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    console.log('⏰ checkSetupStatus STARTED');
    
    try {
      const user = firebaseService.getCurrentUser();
      console.log('👤 Current user:', user ? `${user.uid} (${user.email})` : 'NULL');
      
      if (!user) {
        console.log('❌ NO USER - Setting hasCompletedSetup = false');
        setHasCompletedSetup(false);
        setIsLoading(false);
        return;
      }
      
      console.log('🔍 Fetching user profile...');
      const userProfile = await firebaseService.getUserProfile();
      console.log('📋 User profile received:', JSON.stringify(userProfile, null, 2));
      
      const farmId = userProfile?.farmId;
      console.log('🏠 Farm ID from profile:', farmId || 'NULL/UNDEFINED');
      
      if (!farmId) {
        console.log('⚠️⚠️⚠️ NO FARM ID - USER IS NEW - Setting hasCompletedSetup = FALSE');
        setHasCompletedSetup(false);
      } else {
        console.log('🔍 Fetching farm profile for farmId:', farmId);
        const farmProfile = await firebaseService.getFarmProfile(farmId);
        console.log('🌾 Farm profile received:', JSON.stringify(farmProfile, null, 2));
        
        const setupComplete = farmProfile?.setupCompleted || false;
        console.log('✅ setupCompleted field:', setupComplete);
        console.log(`📊 Setting hasCompletedSetup = ${setupComplete}`);
        setHasCompletedSetup(setupComplete);
      }
      
    } catch (error) {
      console.error('💥💥💥 ERROR in checkSetupStatus:', error);
      setHasCompletedSetup(false);
    } finally {
      console.log('🏁 checkSetupStatus FINISHED');
      setIsLoading(false);
    }
  };

  console.log('🎬 RENDER - isLoading:', isLoading, 'hasCompletedSetup:', hasCompletedSetup);

  if (isLoading) {
    console.log('⏳ Showing loading spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Decision logic with extreme logging
  console.log('🤔 DECISION TIME:');
  console.log('   - requireSetup:', requireSetup);
  console.log('   - hasCompletedSetup:', hasCompletedSetup);
  console.log('   - location.pathname:', location.pathname);

  if (requireSetup && !hasCompletedSetup) {
    console.log('🔄🔄🔄 REDIRECTING TO /farm-setup (setup required but not complete)');
    return <Navigate to="/farm-setup" state={{ from: location }} replace />;
  }

  if (!requireSetup && hasCompletedSetup) {
    console.log('🔄🔄🔄 REDIRECTING TO /dashboard (setup already complete)');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('✅✅✅ RENDERING CHILDREN - No redirect needed');
  return <>{children}</>;
}
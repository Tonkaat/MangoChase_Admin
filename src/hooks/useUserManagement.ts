import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  Timestamp,
  where,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { firebaseService } from '@/services/firebase';
import type { UserAccount, UserActivity, UserRole } from '@/types/user.types';

const db = firebaseService.firestore;

export function useUserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFarmId, setCurrentFarmId] = useState<string | null>(null);

  // Get the current logged-in user's farm
  useEffect(() => {
    const loadCurrentUserFarm = async () => {
      try {
        const farmId = await firebaseService.getCurrentUserFarmId();
        console.log('Current user farm ID:', farmId);
        setCurrentFarmId(farmId);
      } catch (error) {
        console.error('Error loading current user farm:', error);
      }
    };

    loadCurrentUserFarm();
  }, []);

  // Load users assigned to the current farm
  useEffect(() => {
    if (!currentFarmId) {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');
    
    // Query users where assignedFarms contains currentFarmId OR farmId equals currentFarmId
    const q = query(
      usersRef,
      where('assignedFarms', 'array-contains', currentFarmId)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userList: UserAccount[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || undefined,
          role: (data.role as UserRole) || 'farmer',
          status: data.status || 'active',
          assignedFarms: data.assignedFarms || (data.farmId ? [data.farmId] : []),
          verificationTier: data.verificationTier || (data.role === 'farmer' ? 'basic' : undefined),
          verificationStatus: data.verificationStatus || (data.role === 'farmer' ? 'pending' : undefined),
          avatarUrl: data.avatarUrl || undefined,
          verificationNotes: data.verificationNotes || undefined,
          verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
          verifiedBy: data.verifiedBy || undefined,
          suspendedAt: data.suspendedAt ? (data.suspendedAt as Timestamp).toDate() : undefined,
          suspendedReason: data.suspendedReason || undefined,
          lastLoginAt: data.lastLoginAt ? (data.lastLoginAt as Timestamp).toDate() : undefined,
          lastActivityAt: data.lastActivityAt ? (data.lastActivityAt as Timestamp).toDate() : undefined,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
        };
      });

      // Also get users with old farmId field matching current farm
      const legacyUsersQuery = query(
        usersRef,
        where('farmId', '==', currentFarmId)
      );
      const legacySnapshot = await getDocs(legacyUsersQuery);
      
      legacySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Only add if not already in the list
        if (!userList.find(u => u.id === doc.id)) {
          userList.push({
            id: doc.id,
            email: data.email || '',
            name: data.name || '',
            phone: data.phone || undefined,
            role: (data.role as UserRole) || 'farmer',
            status: data.status || 'active',
            assignedFarms: data.assignedFarms || (data.farmId ? [data.farmId] : []),
            verificationTier: data.verificationTier || (data.role === 'farmer' ? 'basic' : undefined),
            verificationStatus: data.verificationStatus || (data.role === 'farmer' ? 'pending' : undefined),
            avatarUrl: data.avatarUrl || undefined,
            verificationNotes: data.verificationNotes || undefined,
            verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
            verifiedBy: data.verifiedBy || undefined,
            suspendedAt: data.suspendedAt ? (data.suspendedAt as Timestamp).toDate() : undefined,
            suspendedReason: data.suspendedReason || undefined,
            lastLoginAt: data.lastLoginAt ? (data.lastLoginAt as Timestamp).toDate() : undefined,
            lastActivityAt: data.lastActivityAt ? (data.lastActivityAt as Timestamp).toDate() : undefined,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
            updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
          });
        }
      });
      
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentFarmId]);

  // Load only the current farm
  useEffect(() => {
    if (!currentFarmId) return;

    const farmRef = doc(db, 'farms', currentFarmId);
    
    const unsubscribe = onSnapshot(farmRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setFarms([{
          id: docSnapshot.id,
          name: docSnapshot.data().name || 'Current Farm',
        }]);
      }
    });

    return () => unsubscribe();
  }, [currentFarmId]);

  // Load activities for current farm
  useEffect(() => {
    if (!currentFarmId) return;

    const loadActivities = async () => {
      try {
        const activityRef = collection(db, 'userActivities');
        const q = query(activityRef, where('farmId', '==', currentFarmId));
        const snapshot = await getDocs(q);
        
        const activityList: UserActivity[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || '',
            action: data.action || 'view',
            resource: data.resource || '',
            resourceId: data.resourceId || undefined,
            details: data.details || undefined,
            ipAddress: data.ipAddress || undefined,
            userAgent: data.userAgent || undefined,
            timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date(),
          };
        });
        
        setActivities(activityList);
      } catch (error) {
        console.log('No activities yet for this farm');
      }
    };

    loadActivities();
  }, [currentFarmId]);

  // Add a new user to the current farm
  const addUser = async (userData: Partial<UserAccount>) => {
    if (!currentFarmId) {
      throw new Error('No current farm selected');
    }

    try {
      const userRef = doc(collection(db, 'users'));
      
      await setDoc(userRef, {
        email: userData.email,
        name: userData.name,
        phone: userData.phone || null,
        role: userData.role || 'farmer',
        status: 'active',
        // Assign to current farm
        assignedFarms: [currentFarmId],
        farmId: currentFarmId, // Keep for backwards compatibility
        verificationTier: userData.role === 'farmer' ? 'basic' : undefined,
        verificationStatus: userData.role === 'farmer' ? 'pending' : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          notifications: true,
          darkMode: false,
          businessMode: false,
          hasCompletedSetup: false,
        }
      });

      return userRef.id;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  // Update existing user
  const updateUser = async (userId: string, updates: Partial<UserAccount>) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // If updating assignedFarms, also update farmId for backwards compatibility
      if (updates.assignedFarms && updates.assignedFarms.length > 0) {
        updateData.farmId = updates.assignedFarms[0];
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Delete user (soft delete)
  const deleteUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'inactive',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Suspend user
  const suspendUser = async (userId: string, reason: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'suspended',
        suspendedAt: serverTimestamp(),
        suspendedReason: reason,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  };

  // Reactivate user
  const reactivateUser = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'active',
        suspendedAt: null,
        suspendedReason: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  };

  return {
    users,
    activities,
    farms,
    loading,
    currentFarmId,
    addUser,
    updateUser,
    deleteUser,
    suspendUser,
    reactivateUser,
  };
}
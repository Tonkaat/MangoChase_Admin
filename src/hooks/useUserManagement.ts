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
  orderBy,
} from 'firebase/firestore';
import { firebaseService } from '@/services/firebase';
import type { UserAccount, UserActivity, UserRole } from '@/types/user.types';

const db = firebaseService.firestore;

export interface Cluster {
  id: string;
  name: string;
  treeCount?: number;
  farmerName?: string; // farmer currently assigned
  farmId?: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFarmId, setCurrentFarmId] = useState<string | null>(null);

  // Load current user's farm
  useEffect(() => {
    const loadCurrentUserFarm = async () => {
      try {
        const farmId = await firebaseService.getCurrentUserFarmId();
        setCurrentFarmId(farmId);
      } catch (error) {
        console.error('Error loading current user farm:', error);
      }
    };
    loadCurrentUserFarm();
  }, []);

  // Load users for the current farm
  useEffect(() => {
    if (!currentFarmId) {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');

    // Primary query: users with assignedClusters pointing to farm's clusters
    // We also support legacy farmId field
    const q = query(usersRef, where('farmId', '==', currentFarmId));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const userList: UserAccount[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return mapDocToUser(docSnap.id, data);
        });

        // Also fetch users assigned via assignedClusters within this farm.
        //
        // ⚠️ Cluster doc IDs are NOT globally unique — they're just names
        // like "Default" or "Block A" (see treeService, which defaults every
        // new farm's first cluster to "Default"). This query has no farmId
        // filter, so without the guard below it can match a farmer on a
        // *different* farm whose own cluster happens to share the same
        // name/ID — that's the "farmer from another farm shows up here"
        // bug. We keep the query farmId-less (so legacy docs missing a
        // farmId are still caught), but reject any result whose farmId is
        // explicitly set to some other farm.
        const clusterIds = clusters.map((c) => c.id);
        if (clusterIds.length > 0) {
          // Firestore 'array-contains-any' supports up to 30 values
          const clusterQuery = query(
            usersRef,
            where('assignedClusters', 'array-contains-any', clusterIds.slice(0, 30))
          );
          const clusterSnapshot = await getDocs(clusterQuery);
          clusterSnapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const belongsToAnotherFarm = data.farmId && data.farmId !== currentFarmId;
            if (!belongsToAnotherFarm && !userList.find((u) => u.id === docSnap.id)) {
              userList.push(mapDocToUser(docSnap.id, data));
            }
          });
        }

        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentFarmId, clusters]);

  // Load clusters from farms/{farmId}/clusters subcollection
  useEffect(() => {
    if (!currentFarmId) return;

    // ✅ Correct path — matches treeService.getClusters()
    const clustersRef = collection(db, 'farms', currentFarmId, 'clusters');
    const q = query(clustersRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const clusterList: Cluster[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // Resolve farmer name assigned to this cluster.
          //
          // Same cross-farm leakage risk as above: this query matches on
          // cluster ID alone, with no farmId filter, so a farmer on another
          // farm whose cluster happens to share this ID/name would
          // otherwise get shown as "assigned" here. Filter the candidates
          // down to ones that actually belong to this farm (or have no
          // farmId at all, for legacy docs) before taking the first match.
          let farmerName: string | undefined;
          try {
            const farmerQuery = query(
              collection(db, 'users'),
              where('assignedClusters', 'array-contains', docSnap.id),
              where('role', '==', 'farmer')
            );
            const farmerSnap = await getDocs(farmerQuery);
            const matchingFarmer = farmerSnap.docs.find((d) => {
              const fd = d.data();
              return !fd.farmId || fd.farmId === currentFarmId;
            });
            if (matchingFarmer) {
              farmerName = matchingFarmer.data().name;
            }
          } catch (_) {
            // non-critical
          }

          return {
            id: docSnap.id,
            // clusters use doc.id as the name (e.g. "Block A")
            name: data.name || docSnap.id,
            treeCount: data.treeCount ?? undefined,
            farmId: currentFarmId,
            farmerName,
          };
        })
      );

      setClusters(clusterList);
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

        const activityList: UserActivity[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || '',
            userName: data.userName || '',
            action: data.action || 'view',
            resource: data.resource || '',
            resourceId: data.resourceId ?? undefined,
            details: data.details ?? undefined,
            ipAddress: data.ipAddress ?? undefined,
            userAgent: data.userAgent ?? undefined,
            timestamp: data.timestamp
              ? (data.timestamp as Timestamp).toDate()
              : new Date(),
          };
        });

        setActivities(activityList);
      } catch (_) {
        // no activities yet
      }
    };

    loadActivities();
  }, [currentFarmId]);

  // CRUD operations

  const addUser = async (userData: Partial<UserAccount>) => {
    if (!currentFarmId) throw new Error('No current farm selected');

    const userRef = doc(collection(db, 'users'));
    await setDoc(userRef, {
      email: userData.email,
      name: userData.name,
      phone: userData.phone || null,
      role: userData.role || 'farmer',
      status: 'active',
      farmId: currentFarmId,
      assignedClusters: userData.assignedClusters || [],
      verificationTier: userData.role === 'farmer' ? 'basic' : null,
      verificationStatus: userData.role === 'farmer' ? 'pending' : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        notifications: true,
        darkMode: false,
        businessMode: false,
        hasCompletedSetup: false,
      },
    });
    return userRef.id;
  };

  const updateUser = async (userId: string, updates: Partial<UserAccount>) => {
    const userRef = doc(db, 'users', userId);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    await updateDoc(userRef, updateData);
  };

  // Soft delete
  const deleteUser = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      status: 'inactive',
      updatedAt: serverTimestamp(),
    });
  };

  const suspendUser = async (userId: string, reason: string) => {
    await updateDoc(doc(db, 'users', userId), {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspendedReason: reason,
      updatedAt: serverTimestamp(),
    });
  };

  const reactivateUser = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      status: 'active',
      suspendedAt: null,
      suspendedReason: null,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    users,
    activities,
    clusters,
    loading,
    currentFarmId,
    addUser,
    updateUser,
    deleteUser,
    suspendUser,
    reactivateUser,
  };
}

// Helper to map Firestore doc → UserAccount
function mapDocToUser(id: string, data: Record<string, any>): UserAccount {
  return {
    id,
    email: data.email || '',
    name: data.name || '',
    phone: data.phone ?? undefined,
    role: (data.role as UserRole) || 'farmer',
    status: data.status || 'active',
    assignedClusters: data.assignedClusters || [],
    // legacy support
    assignedFarms: data.assignedFarms || (data.farmId ? [data.farmId] : []),
    verificationTier: data.verificationTier ?? (data.role === 'farmer' ? 'basic' : undefined),
    verificationStatus: data.verificationStatus ?? (data.role === 'farmer' ? 'pending' : undefined),
    avatarUrl: data.avatarUrl ?? undefined,
    verificationNotes: data.verificationNotes ?? undefined,
    verifiedAt: data.verifiedAt ? (data.verifiedAt as Timestamp).toDate() : undefined,
    verifiedBy: data.verifiedBy ?? undefined,
    suspendedAt: data.suspendedAt ? (data.suspendedAt as Timestamp).toDate() : undefined,
    suspendedReason: data.suspendedReason ?? undefined,
    lastLoginAt: data.lastLoginAt ? (data.lastLoginAt as Timestamp).toDate() : undefined,
    lastActivityAt: data.lastActivityAt ? (data.lastActivityAt as Timestamp).toDate() : undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
  };
}
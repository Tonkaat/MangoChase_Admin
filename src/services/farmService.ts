// src/services/farmService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Farm {
  id: string;
  name: string;
  location: string;
  farmSize: number;
  numberOfTrees: number;
  cropType: string;
  farmingType: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  setupComplete?: boolean;
}

export interface FarmStatistics {
  totalTrees: number;
  healthyTrees: number;
  flaggedTrees: number;
  pendingTasks: number;
  completedTasks: number;
  recentScans: number;
}

class FarmService {
  private farmsCollection = collection(db, 'farms');

  async createFarm(farmData: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const farmRef = doc(this.farmsCollection);
    
    await setDoc(farmRef, {
      ...farmData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      setupComplete: false,
    });

    return farmRef.id;
  }

  async getFarm(farmId: string): Promise<Farm | null> {
    const farmRef = doc(db, 'farms', farmId);
    const farmDoc = await getDoc(farmRef);

    if (!farmDoc.exists()) {
      return null;
    }

    const data = farmDoc.data();
    return {
      id: farmDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Farm;
  }

  async getUserFarms(userId: string): Promise<Farm[]> {
    const q = query(
      this.farmsCollection,
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Farm[];
  }

  async updateFarm(farmId: string, updates: Partial<Farm>): Promise<void> {
    const farmRef = doc(db, 'farms', farmId);
    await updateDoc(farmRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteFarm(farmId: string): Promise<void> {
    const farmRef = doc(db, 'farms', farmId);
    await deleteDoc(farmRef);
  }

  async getFarmStatistics(farmId: string): Promise<FarmStatistics> {
    // Get trees count
    const treesSnapshot = await getDocs(
      collection(db, 'farms', farmId, 'trees')
    );
    
    const trees = treesSnapshot.docs.map(doc => doc.data());
    const totalTrees = trees.length;
    const healthyTrees = trees.filter(t => t.healthStatus === 'healthy').length;
    const flaggedTrees = trees.filter(t => t.flagged === true).length;

    // Get tasks count
    const tasksSnapshot = await getDocs(
      collection(db, 'farms', farmId, 'tasks')
    );
    
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    // Get recent scans (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const scansSnapshot = await getDocs(
      collection(db, 'farms', farmId, 'scans')
    );
    
    const recentScans = scansSnapshot.docs.filter(doc => {
      const scanDate = (doc.data().timestamp as Timestamp)?.toDate();
      return scanDate && scanDate > thirtyDaysAgo;
    }).length;

    return {
      totalTrees,
      healthyTrees,
      flaggedTrees,
      pendingTasks,
      completedTasks,
      recentScans,
    };
  }

  async isFarmSetupComplete(farmId: string): Promise<boolean> {
    const farm = await this.getFarm(farmId);
    return farm?.setupComplete || false;
  }
}

export const farmService = new FarmService();
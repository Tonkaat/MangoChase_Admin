// src/services/firebase/farm-service.ts
import { 
  db, 
  auth,
  serverTimestamp,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  setDoc
} from './firebaseConfig';

import type { Cluster } from '@/components/scheduling/AddTaskDialog';

export class FarmService {
  
  async createOrUpdateFarmProfile(options: {
    name: string;
    location: string;
    farmSize: number;
    numberOfTrees: number;
    cropType: string;
    farmingType: string;
    farmId?: string;
    ownerId?: string;
  }): Promise<string> {
    const { name, location, farmSize, numberOfTrees, cropType, farmingType, farmId, ownerId } = options;
    const userId = ownerId || auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    const farmData: Record<string, any> = {
      ownerId: userId,
      name,
      location,
      farmSize,
      numberOfTrees,
      cropType,
      farmingType,
      setupCompleted: true,
      updatedAt: serverTimestamp(),
    };

    if (farmId && farmId.trim() !== '') {
      await updateDoc(doc(db, 'farms', farmId), farmData);
      console.log('✅ Updated farm profile:', farmId);
      return farmId;
    } else {
      let farmCode: string;
      let isUnique = false;
      
      do {
        farmCode = this.generateFarmCode();
        const existing = await this.getFarmIdByCode(farmCode);
        isUnique = existing === null;
      } while (!isUnique);

      const farmRef = await addDoc(collection(db, 'farms'), {
        ...farmData,
        farmCode,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'farms', farmRef.id, 'members', userId), {
        userId,
        role: 'owner',
        joinedAt: serverTimestamp(),
      });

      await this._initializeFarmStatistics(farmRef.id, numberOfTrees, farmSize, cropType);
      console.log('✅ Created new farm profile:', farmRef.id, 'with code:', farmCode);
      return farmRef.id;
    }
  }

  async getFarmProfile(farmId: string): Promise<Record<string, any> | null> {
    try {
      const docSnap = await getDoc(doc(db, 'farms', farmId));
      
      if (!docSnap.exists()) {
        console.log('❌ Farm not found:', farmId);
        return null;
      }

      return {
        farmId: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error getting farm profile:', error);
      return null;
    }
  }

  getFarmProfileStream(farmId: string, callback: (data: Record<string, any> | null) => void): () => void {
    return onSnapshot(doc(db, 'farms', farmId), (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
      } else {
        callback({
          farmId: docSnap.id,
          ...docSnap.data()
        });
      }
    }, (error) => {
      console.error('Error in farm profile stream:', error);
      callback(null);
    });
  }

  // ─── Clusters ──────────────────────────────────────────────────────────────

  /**
   * Fetches all clusters for a farm from `farms/{farmId}/clusters`.
   *
   * Each cluster document is expected to have:
   *   - name: string
   *   - assignedFarmerId?: string   (UID of the farmer)
   *   - assignedFarmerName?: string (display name for the UI)
   *
   * Returns an array shaped to the `Cluster` type used by AddTaskDialog.
   */
  async getClusters(farmId: string): Promise<Cluster[]> {
    try {
      const snapshot = await getDocs(collection(db, 'farms', farmId, 'clusters'));
      const clusters: Cluster[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? d.id,
          assignedFarmerId: data.assignedFarmerId ?? undefined,
          assignedFarmerName: data.assignedFarmerName ?? undefined,
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      console.log(`📦 getClusters — farm: ${farmId} — found: ${clusters.length}`, clusters.map(c => c.name));
      return clusters;
    } catch (error) {
      console.error('❌ Error getting clusters:', error);
      return [];
    }
  }

  /**
   * Real-time stream of clusters. Returns an unsubscribe function.
   * Use this if your cluster list can change while the scheduling page is open.
   */
  getClustersStream(
    farmId: string,
    callback: (clusters: Cluster[]) => void,
  ): () => void {
    console.log(`🔄 getClustersStream — subscribing to farms/${farmId}/clusters`);
    return onSnapshot(
      collection(db, 'farms', farmId, 'clusters'),
      (snapshot) => {
        console.log(`📦 getClustersStream — farm: ${farmId} — size: ${snapshot.size}`);
        const clusters: Cluster[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            console.log('  cluster doc:', d.id, data);
            return {
              id: d.id,
              name: data.name ?? d.id,
              assignedFarmerId: data.assignedFarmerId ?? undefined,
              assignedFarmerName: data.assignedFarmerName ?? undefined,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        callback(clusters);
      },
      (error) => {
        console.error('❌ getClustersStream error:', error);
        callback([]);
      },
    );
  }

  // ─── Farm code helpers ─────────────────────────────────────────────────────

  private generateFarmCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async getFarmIdByCode(code: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, 'farms'),
        where('farmCode', '==', code.toUpperCase()),
        limit(1),
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].id;
    } catch (error) {
      console.error('Error checking farm code:', error);
      return null;
    }
  }

  async getFarmCode(farmId: string): Promise<string | null> {
    try {
      const farmDoc = await getDoc(doc(db, 'farms', farmId));
      if (!farmDoc.exists()) return null;
      return farmDoc.data().farmCode || null;
    } catch (error) {
      console.error('Error getting farm code:', error);
      return null;
    }
  }

  // ─── Profile updates ───────────────────────────────────────────────────────

  async updateFarmProfile(farmId: string, updates: Record<string, any>): Promise<void> {
    try {
      await updateDoc(doc(db, 'farms', farmId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Updated farm profile fields:', Object.keys(updates));
    } catch (error) {
      console.error('Error updating farm profile:', error);
      throw error;
    }
  }

  async isFarmSetupComplete(farmId: string): Promise<boolean> {
    try {
      const docSnap = await getDoc(doc(db, 'farms', farmId));
      if (!docSnap.exists()) return false;
      return docSnap.data().setupCompleted === true;
    } catch (error) {
      console.error('Error checking farm setup:', error);
      return false;
    }
  }

  async getUserFarms(userId: string): Promise<Record<string, any>[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'farms'), where('ownerId', '==', userId)),
      );
      return snapshot.docs.map((d) => ({ farmId: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error getting user farms:', error);
      return [];
    }
  }

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getFarmStatisticsWithSetup(farmId: string): Promise<Record<string, any>> {
    try {
      const farmProfile = await this.getFarmProfile(farmId);
      const statsDoc = await getDoc(doc(db, 'farms', farmId, 'statistics', 'stats'));

      const stats = statsDoc.exists()
        ? statsDoc.data()
        : await this._calculateStatistics(farmId);

      return {
        farmName: farmProfile?.name || 'Unknown Farm',
        farmLocation: farmProfile?.location || 'Unknown Location',
        farmSize: farmProfile?.farmSize || 0.0,
        cropType: farmProfile?.cropType || 'Unknown',
        farmingType: farmProfile?.farmingType || 'Personal',
        setupCompleted: farmProfile?.setupCompleted || false,
        ...(stats || {}),
      };
    } catch (error) {
      console.error('Error getting farm statistics with setup:', error);
      return { totalTrees: 0, healthyTrees: 0, flaggedTrees: 0, avgYield: 0 };
    }
  }

  async deleteFarm(farmId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const collections = ['trees', 'journal', 'tasks', 'scans', 'statistics', 'clusters'];
      
      for (const col of collections) {
        const snapshot = await getDocs(query(collection(db, 'farms', farmId, col)));
        snapshot.docs.forEach((d) => batch.delete(d.ref));
      }

      batch.delete(doc(db, 'farms', farmId));
      await batch.commit();
      console.log('✅ Deleted farm and all data:', farmId);
    } catch (error) {
      console.error('Error deleting farm:', error);
      throw error;
    }
  }

  private async _initializeFarmStatistics(
    farmId: string,
    numberOfTrees: number,
    farmSize: number,
    cropType: string,
  ): Promise<void> {
    await setDoc(doc(db, 'farms', farmId, 'statistics', 'stats'), {
      totalTrees: numberOfTrees,
      healthyTrees: 0,
      flaggedTrees: 0,
      avgYield: 0,
      farmSize,
      cropType,
      updatedAt: serverTimestamp(),
    });
  }

  private async _calculateStatistics(farmId: string): Promise<Record<string, any>> {
    const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
    
    let healthyTrees = 0;
    let flaggedTrees = 0;

    snapshot.docs.forEach((d) => {
      const data = d.data();
      if (data.healthStatus === 'Healthy') healthyTrees++;
      if (data.flagged === true) flaggedTrees++;
    });

    const stats = {
      totalTrees: snapshot.size,
      healthyTrees,
      flaggedTrees,
      avgYield: 0,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'farms', farmId, 'statistics', 'stats'), stats, { merge: true });
    return stats;
  }

  // ─── Backward compatibility aliases ───────────────────────────────────────

  async createFarm(options: { name: string; location: string }): Promise<string> {
    return this.createOrUpdateFarmProfile({
      name: options.name,
      location: options.location,
      farmSize: 0.0,
      numberOfTrees: 0,
      cropType: 'Mango',
      farmingType: 'Personal',
    });
  }

  async updateFarm(farmId: string, updates: Record<string, any>): Promise<void> {
    return this.updateFarmProfile(farmId, updates);
  }

  async getFarm(farmId: string): Promise<Record<string, any> | null> {
    return this.getFarmProfile(farmId);
  }

  async getStatistics(farmId: string): Promise<Record<string, any>> {
    const statsDoc = await getDoc(doc(db, 'farms', farmId, 'statistics', 'stats'));
    if (!statsDoc.exists()) return this._calculateStatistics(farmId);
    return statsDoc.data() || {};
  }

  getStatisticsStream(
    farmId: string,
    callback: (data: Record<string, any> | null) => void,
  ): () => void {
    return onSnapshot(
      doc(db, 'farms', farmId, 'statistics', 'stats'),
      (docSnap) => callback(docSnap.exists() ? docSnap.data() : null),
      (error) => {
        console.error('Error in statistics stream:', error);
        callback(null);
      },
    );
  }
}

// Export singleton instance
export const farmService = new FarmService();
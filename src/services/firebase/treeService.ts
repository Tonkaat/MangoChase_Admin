// src/services/firebase/tree-service.ts
import { 
  db, 
  auth,
  serverTimestamp,
  Timestamp,
  FieldValue,
  collection,
  doc,
  addDoc,
  setDoc,
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
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe
} from './firebaseConfig';

export interface TreeData {
  tree_id?: string;
  tree_name?: string;
  type?: string;
  healthStatus?: string;
  growthStage?: string;
  cluster?: string;
  flagged?: boolean;
  variety?: string;
  lastInspection?: any;
  createdAt?: any;
  [key: string]: any;
}

export class TreeService {
  
  /**
   * ⚠️ EXACT SAME IMPLEMENTATION AS FLUTTER!
   * Adds a new tree with flexible parameter support
   * 
   * Supports two modes:
   * 1. Direct data map (new setup system): Pass treeData with tree_id and tree_name
   * 2. Legacy parameters: Pass individual fields for backward compatibility
   */
  async addTree(options: {
    farmId: string;
    type?: string;
    healthStatus?: string;
    growthStage?: string;
    cluster?: string;
    flagged?: boolean;
    treeData?: TreeData;
  }): Promise<string> {
    try {
      const { farmId, treeData, type, healthStatus, growthStage, cluster, flagged = false } = options;
      
      let dataToSave: Record<string, any>;

      // ⚠️ NEW: If treeData is provided, use it directly (setup system) - MATCHING FLUTTER
      if (treeData) {
        dataToSave = {
          ...treeData,
          lastInspection: serverTimestamp(),
        };
        
        // ⚠️ Ensure required fields exist (EXACT SAME VALIDATION AS FLUTTER)
        if (!treeData.tree_id) {
          throw new Error('tree_id is required in treeData');
        }
        if (!treeData.tree_name) {
          throw new Error('tree_name is required in treeData');
        }
      } 
      // ⚠️ LEGACY: Use named parameters (backward compatibility) - MATCHING FLUTTER
      else {
        dataToSave = {
          type: type || 'Unknown',
          healthStatus: healthStatus || 'Unknown',
          lastInspection: serverTimestamp(),
          flagged: flagged,
          growthStage: growthStage || 'Unknown',
          cluster: cluster || 'Default',
          createdAt: serverTimestamp(),
        };
      }

      console.log('🌳 TreeService.addTree - dataToSave:', dataToSave);

      // ⚠️ EXACT SAME FIRESTORE PATH AS FLUTTER
      const treeRef = await addDoc(
        collection(db, 'farms', farmId, 'trees'),
        dataToSave
      );

      // Update statistics (matching Flutter)
      await this._updateTreeStatistics(farmId);
      
      console.log('✅ Tree added with ID:', treeRef.id);
      if (treeData) {
        console.log('   tree_id:', treeData.tree_id);
        console.log('   tree_name:', treeData.tree_name);
      }
      
      return treeRef.id;
    } catch (error) {
      console.error('❌ Error adding tree:', error);
      throw error;
    }
  }

  async updateTree(farmId: string, treeId: string, updates: Record<string, any>): Promise<void> {
    try {
      // ⚠️ EXACT SAME UPDATE LOGIC AS FLUTTER
      await updateDoc(
        doc(db, 'farms', farmId, 'trees', treeId),
        {
          ...updates,
          lastInspection: serverTimestamp(),
        }
      );

      // ⚠️ Same conditional update as Flutter
      if (updates.healthStatus !== undefined || 
          updates.flagged !== undefined ||
          updates.cluster !== undefined) {
        await this._updateTreeStatistics(farmId);
      }
      
      console.log('✅ Tree updated:', treeId);
    } catch (error) {
      console.error('❌ Error updating tree:', error);
      throw error;
    }
  }

  async deleteTree(farmId: string, treeId: string): Promise<void> {
    try {
      // ⚠️ EXACT SAME PATH AS FLUTTER
      await deleteDoc(doc(db, 'farms', farmId, 'trees', treeId));
      await this._updateTreeStatistics(farmId);
      console.log('✅ Tree deleted:', treeId);
    } catch (error) {
      console.error('❌ Error deleting tree:', error);
      throw error;
    }
  }

  async flagTree(farmId: string, treeId: string, flagged: boolean): Promise<void> {
    // ⚠️ Same as Flutter - calls updateTree
    return this.updateTree(farmId, treeId, { flagged });
  }

  /**
   * ⚠️ EXACT SAME QUERY AS FLUTTER!
   * Gets trees stream with same ordering and debugging
   */
  getTrees(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const currentUser = auth.currentUser;
    
    console.log('');
    console.log('🔥🔥🔥 ========================================');
    console.log('🔥 TreeService.getTrees CALLED');
    console.log('🔥🔥🔥 ========================================');
    console.log('📍 farmId:', farmId);
    console.log('👤 user:', currentUser?.uid);
    console.log('📧 email:', currentUser?.email);
    console.log('⏰ timestamp:', new Date().toISOString());
    console.log('🔥🔥🔥 ========================================');
    console.log('');
    
    // Test farm document access
    getDoc(doc(db, 'farms', farmId))
      .then((farmDoc) => {
        console.log('🏠 FARM DOCUMENT CHECK:');
        console.log('   exists:', farmDoc.exists());
        if (farmDoc.exists()) {
          console.log('   data:', farmDoc.data());
        } else {
          console.log('   ❌ FARM DOES NOT EXIST!');
        }
      })
      .catch((e) => {
        console.log('❌ FARM ACCESS ERROR:', e);
      });
    
    // Test trees collection access
    getDocs(collection(db, 'farms', farmId, 'trees'))
      .then((treesSnapshot) => {
        console.log('🌳 TREES COLLECTION CHECK:');
        console.log('   count:', treesSnapshot.docs.length);
        if (treesSnapshot.docs.length > 0) {
          console.log('   First tree:', treesSnapshot.docs[0].data());
        } else {
          console.log('   ⚠️ NO TREES IN COLLECTION!');
        }
      })
      .catch((e) => {
        console.log('❌ TREES ACCESS ERROR:', e);
      });
    
    // ⚠️ EXACT SAME QUERY STRUCTURE AS FLUTTER
    const treesRef = collection(db, 'farms', farmId, 'trees');
    const q = query(treesRef, orderBy('lastInspection', 'desc'));
    
    // Return real-time stream matching Flutter
    return onSnapshot(q, 
      (snapshot) => {
        console.log('');
        console.log('📊📊📊 ========================================');
        console.log('📊 TreeService.getTrees DATA RECEIVED');
        console.log('📊📊📊 ========================================');
        console.log('farmId:', farmId);
        console.log('docs count:', snapshot.docs.length);
        console.log('fromCache:', snapshot.metadata.fromCache);
        console.log('hasPendingWrites:', snapshot.metadata.hasPendingWrites);
        
        if (snapshot.docs.length > 0) {
          console.log('Sample tree IDs:');
          const count = Math.min(snapshot.docs.length, 3);
          for (let i = 0; i < count; i++) {
            const doc = snapshot.docs[i];
            const data = doc.data();
            console.log(`  [${i}] id: ${doc.id}, tree_id: ${data.tree_id}, tree_name: ${data.tree_name}`);
          }
        } else {
          console.log('⚠️⚠️⚠️ SNAPSHOT IS EMPTY! NO TREES RETURNED!');
        }
        console.log('📊📊📊 ========================================');
        console.log('');
        
        callback(snapshot);
      },
      (error) => {
        console.log('');
        console.log('❌❌❌ ========================================');
        console.log('❌ TreeService.getTrees STREAM ERROR');
        console.log('❌❌❌ ========================================');
        console.log('Error:', error);
        console.log('farmId:', farmId);
        console.log('user:', currentUser?.uid);
        console.log('❌❌❌ ========================================');
        console.log('');
      }
    );
  }

  // ⚠️ Gets all flagged trees - WITH DEBUG LOGGING (MATCHING FLUTTER)
  getFlaggedTrees(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const currentUser = auth.currentUser;
    console.log('🚩 TreeService.getFlaggedTrees CALLED - farmId:', farmId, 'user:', currentUser?.uid);
    
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('flagged', '==', true),
      orderBy('lastInspection', 'desc')
    );
    
    return onSnapshot(q, 
      (snapshot) => {
        console.log('📊 TreeService.getFlaggedTrees DATA - farmId:', farmId, 'docs:', snapshot.docs.length, 'user:', auth.currentUser?.uid);
        callback(snapshot);
      },
      (error) => {
        console.error('❌ TreeService.getFlaggedTrees ERROR - farmId:', farmId, 'error:', error);
      }
    );
  }

  // Individual tree methods
  async getTree(farmId: string, treeId: string): Promise<Record<string, any> | null> {
    try {
      const docSnap = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('❌ Error getting tree:', error);
      throw error;
    }
  }

  async getTreeSafe(farmId: string, treeId: string): Promise<Record<string, any> | null> {
    try {
      const docSnap = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.log('⚠️ Error getting tree (safe):', error);
      return null;
    }
  }

  // Gets tree by tree_id (UUID for QR codes)
  async getTreeByUUID(farmId: string, treeUuid: string): Promise<Record<string, any> | null> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('tree_id', '==', treeUuid),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0 ? { 
        id: snapshot.docs[0].id, 
        ...snapshot.docs[0].data() 
      } : null;
    } catch (error) {
      console.error('❌ Error getting tree by UUID:', error);
      return null;
    }
  }

  // Gets tree by tree_name (human-readable name)
  async getTreeByName(farmId: string, treeName: string): Promise<Record<string, any> | null> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('tree_name', '==', treeName),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0 ? { 
        id: snapshot.docs[0].id, 
        ...snapshot.docs[0].data() 
      } : null;
    } catch (error) {
      console.error('❌ Error getting tree by name:', error);
      return null;
    }
  }

  // Search trees by name prefix
  async searchTreesByName(farmId: string, namePrefix: string): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('tree_name', '>=', namePrefix),
        where('tree_name', '<=', namePrefix + '\uf8ff'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error searching trees:', error);
      return [];
    }
  }

  // Gets a stream of a single tree
  getTreeStream(farmId: string, treeId: string, callback: (data: Record<string, any> | null) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'farms', farmId, 'trees', treeId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          callback({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in tree stream:', error);
      }
    );
  }

  // ==========================================
  // CLUSTER METHODS (MATCHING FLUTTER)
  // ==========================================

  getTreesByCluster(farmId: string, cluster: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('cluster', '==', cluster),
      orderBy('lastInspection', 'desc')
    );
    
    return onSnapshot(q, callback);
  }

  getClusters(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'clusters'),
      orderBy('name')
    );
    
    return onSnapshot(q, callback);
  }

  async getClustersList(farmId: string): Promise<string[]> {
    try {
      const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
      
      const clusters = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        clusters.add(data.cluster || 'Default');
      });

      return Array.from(clusters).sort();
    } catch (error) {
      console.error('❌ Error getting clusters:', error);
      return [];
    }
  }

  async updateTreeCluster(farmId: string, treeId: string, newCluster: string): Promise<void> {
    return this.updateTree(farmId, treeId, { cluster: newCluster });
  }

  async batchUpdateTreesCluster(farmId: string, treeIds: string[], cluster: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const treeId of treeIds) {
        const treeRef = doc(db, 'farms', farmId, 'trees', treeId);
        batch.update(treeRef, {
          cluster: cluster,
          lastInspection: serverTimestamp(),
        });
      }

      await batch.commit();
      console.log('✅ Batch updated', treeIds.length, 'trees to cluster:', cluster);
    } catch (error) {
      console.error('❌ Error batch updating trees:', error);
      throw error;
    }
  }

  async getClusterStatistics(farmId: string, cluster: string): Promise<Record<string, any>> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('cluster', '==', cluster)
      );
      
      const snapshot = await getDocs(q);
      
      let totalTrees = snapshot.docs.length;
      let healthyTrees = 0;
      let flaggedTrees = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.healthStatus === 'Healthy') healthyTrees++;
        if (data.flagged === true) flaggedTrees++;
      });

      return {
        totalTrees,
        healthyTrees,
        flaggedTrees,
        healthPercentage: totalTrees > 0 ? (healthyTrees / totalTrees * 100) : 0,
      };
    } catch (error) {
      console.error('❌ Error getting cluster statistics:', error);
      return {
        totalTrees: 0,
        healthyTrees: 0,
        flaggedTrees: 0,
        healthPercentage: 0,
      };
    }
  }

  async migrateExistingTreesToCluster(farmId: string): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
      const batch = writeBatch(db);
      let updateCount = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.hasOwnProperty('cluster')) {
          batch.update(doc.ref, { cluster: 'Default' });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log('✅ Migrated', updateCount, 'trees to include cluster field');
      }
    } catch (error) {
      console.error('❌ Error migrating trees:', error);
      throw error;
    }
  }

  async treeExists(farmId: string, treeId: string): Promise<boolean> {
    try {
      const docSnap = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
      return docSnap.exists();
    } catch (error) {
      console.error('❌ Error checking tree existence:', error);
      return false;
    }
  }

  async addCluster(farmId: string, clusterName: string): Promise<void> {
    try {
      const clusterRef = doc(db, 'farms', farmId, 'clusters', clusterName);
      const clusterDoc = await getDoc(clusterRef);

      if (!clusterDoc.exists()) {
        await setDoc(clusterRef, {
          name: clusterName,
          createdAt: serverTimestamp(),
        });
        console.log('✅ Cluster added:', clusterName);
      } else {
        throw new Error(`Cluster "${clusterName}" already exists`);
      }
    } catch (error) {
      console.error('❌ Error adding cluster:', error);
      throw error;
    }
  }

  async deleteClusterFromCollection(farmId: string, clusterName: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'farms', farmId, 'clusters', clusterName));
      console.log('✅ Cluster deleted from collection:', clusterName);
    } catch (error) {
      console.error('❌ Error deleting cluster:', error);
      throw error;
    }
  }

  async getClustersFromCollection(farmId: string): Promise<string[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'farms', farmId, 'clusters'),
          orderBy('name')
        )
      );
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      // Fallback to getting clusters from trees
      console.log('⚠️ Falling back to getClustersList:', error);
      return this.getClustersList(farmId);
    }
  }

  getClustersStream(farmId: string, callback: (clusters: string[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'clusters'),
      orderBy('name')
    );
    
    return onSnapshot(q, (snapshot) => {
      const clusters = snapshot.docs.map(doc => doc.id);
      callback(clusters);
    });
  }

  async renameCluster(farmId: string, oldName: string, newName: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete old cluster document
      const oldClusterRef = doc(db, 'farms', farmId, 'clusters', oldName);
      batch.delete(oldClusterRef);

      // Create new cluster document
      const newClusterRef = doc(db, 'farms', farmId, 'clusters', newName);
      batch.set(newClusterRef, {
        name: newName,
        createdAt: serverTimestamp(),
      });

      // Update all trees with this cluster
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('cluster', '==', oldName)
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { cluster: newName });
      });

      await batch.commit();
      console.log('✅ Cluster renamed:', oldName, '->', newName);
    } catch (error) {
      console.error('❌ Error renaming cluster:', error);
      throw error;
    }
  }

  // ==========================================
  // VARIETY METHODS (NEW)
  // ==========================================

  getTreesByVariety(farmId: string, variety: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('variety', '==', variety),
      orderBy('tree_name')
    );
    
    return onSnapshot(q, callback);
  }

  async getVarietiesList(farmId: string): Promise<string[]> {
    try {
      const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
      
      const varieties = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.variety) varieties.add(data.variety);
      });

      return Array.from(varieties).sort();
    } catch (error) {
      console.error('❌ Error getting varieties:', error);
      return [];
    }
  }

  async getVarietyDistribution(farmId: string): Promise<Record<string, number>> {
    try {
      const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
      
      const distribution: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const variety = data.variety || 'unknown';
        distribution[variety] = (distribution[variety] || 0) + 1;
      });

      return distribution;
    } catch (error) {
      console.error('❌ Error getting variety distribution:', error);
      return {};
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async getTreesWithDetails(farmId: string, limitCount: number = 5): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        orderBy('lastInspection', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting trees with details:', error);
      return [];
    }
  }

  private async _updateTreeStatistics(farmId: string): Promise<void> {
    // ⚠️ Same placeholder as Flutter
    console.log('Updating tree statistics for farm:', farmId);
    // This would trigger Cloud Function or update aggregates
  }
}

// Export singleton instance
export const treeService = new TreeService();
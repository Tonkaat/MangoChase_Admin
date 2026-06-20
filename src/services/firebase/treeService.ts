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
  Unsubscribe,
} from './firebaseConfig';

import type { HarvestRecord } from '@/types/tree.types';

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

  // ── NEW: agronomic fields ──
  age?: number;
  height?: number;
  canopySpread?: number;
  lastYield?: number;
  missedSprayings?: number;

  [key: string]: any;
}

export class TreeService {

  // ─────────────────────────────────────────────────────────────
  // TREE CRUD
  // ─────────────────────────────────────────────────────────────

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

      if (treeData) {
        const cleanTreeData: Record<string, any> = {};
        for (const [key, value] of Object.entries(treeData)) {
          if (value !== undefined) cleanTreeData[key] = value;
        }

        dataToSave = {
          ...cleanTreeData,
          lastInspection: serverTimestamp(),
        };

        if (!treeData.tree_id) throw new Error('tree_id is required in treeData');
        if (!treeData.tree_name) throw new Error('tree_name is required in treeData');
      } else {
        dataToSave = {
          type: type || 'Unknown',
          healthStatus: healthStatus || 'Unknown',
          lastInspection: serverTimestamp(),
          flagged,
          growthStage: growthStage || 'Unknown',
          cluster: cluster || 'Default',
          createdAt: serverTimestamp(),
          missedSprayings: 0,
        };
      }

      const treeRef = await addDoc(
        collection(db, 'farms', farmId, 'trees'),
        dataToSave,
      );

      await this._updateClusterStats(farmId, dataToSave.cluster || cluster || 'Default');

      console.log('✅ Tree added with ID:', treeRef.id);
      return treeRef.id;
    } catch (error) {
      console.error('❌ Error adding tree:', error);
      throw error;
    }
  }

  async updateTree(farmId: string, treeId: string, updates: Record<string, any>): Promise<void> {
    try {
      const cleanUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) cleanUpdates[key] = value;
      }

      await updateDoc(doc(db, 'farms', farmId, 'trees', treeId), {
        ...cleanUpdates,
        lastInspection: serverTimestamp(),
      });

      // Determine which clusters might be affected
      if (
        cleanUpdates.healthStatus !== undefined ||
        cleanUpdates.flagged !== undefined ||
        cleanUpdates.cluster !== undefined ||
        cleanUpdates.height !== undefined ||
        cleanUpdates.canopySpread !== undefined ||
        cleanUpdates.lastYield !== undefined ||
        cleanUpdates.age !== undefined ||
        cleanUpdates.missedSprayings !== undefined
      ) {
        const treeDoc = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
        const clusterName = treeDoc.data()?.cluster || 'Default';
        await this._updateClusterStats(farmId, clusterName);

        // If cluster is changing, update both old and new
        if (cleanUpdates.cluster && cleanUpdates.cluster !== clusterName) {
          await this._updateClusterStats(farmId, cleanUpdates.cluster);
        }
      }

      console.log('✅ Tree updated:', treeId);
    } catch (error) {
      console.error('❌ Error updating tree:', error);
      throw error;
    }
  }

  async deleteTree(farmId: string, treeId: string): Promise<void> {
    try {
      const treeDoc = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
      const clusterName = treeDoc.data()?.cluster || 'Default';

      await deleteDoc(doc(db, 'farms', farmId, 'trees', treeId));
      await this._updateClusterStats(farmId, clusterName);
      console.log('✅ Tree deleted:', treeId);
    } catch (error) {
      console.error('❌ Error deleting tree:', error);
      throw error;
    }
  }

  async flagTree(farmId: string, treeId: string, flagged: boolean): Promise<void> {
    return this.updateTree(farmId, treeId, { flagged });
  }

  // ─────────────────────────────────────────────────────────────
  // TREE QUERIES / STREAMS
  // ─────────────────────────────────────────────────────────────

  getTrees(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const treesRef = collection(db, 'farms', farmId, 'trees');
    const q = query(treesRef, orderBy('lastInspection', 'desc'));

    return onSnapshot(q,
      (snapshot) => {
        console.log(`📊 TreeService.getTrees — farm: ${farmId} — docs: ${snapshot.docs.length}`);
        callback(snapshot);
      },
      (error) => {
        console.error('❌ TreeService.getTrees STREAM ERROR:', error);
      },
    );
  }

  getFlaggedTrees(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('flagged', '==', true),
      orderBy('lastInspection', 'desc'),
    );

    return onSnapshot(q,
      (snapshot) => callback(snapshot),
      (error) => console.error('❌ TreeService.getFlaggedTrees ERROR:', error),
    );
  }

  async getTree(farmId: string, treeId: string): Promise<Record<string, any> | null> {
    const docSnap = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async getTreeSafe(farmId: string, treeId: string): Promise<Record<string, any> | null> {
    try {
      return await this.getTree(farmId, treeId);
    } catch {
      return null;
    }
  }

  async getTreeByUUID(farmId: string, treeUuid: string): Promise<Record<string, any> | null> {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('tree_id', '==', treeUuid),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0
      ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      : null;
  }

  async getTreeByName(farmId: string, treeName: string): Promise<Record<string, any> | null> {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('tree_name', '==', treeName),
      limit(1),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0
      ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      : null;
  }

  async searchTreesByName(farmId: string, namePrefix: string): Promise<Record<string, any>[]> {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('tree_name', '>=', namePrefix),
      where('tree_name', '<=', namePrefix + '\uf8ff'),
      limit(20),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  getTreeStream(farmId: string, treeId: string, callback: (data: Record<string, any> | null) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'farms', farmId, 'trees', treeId),
      (docSnapshot) => {
        callback(docSnapshot.exists() ? { id: docSnapshot.id, ...docSnapshot.data() } : null);
      },
      (error) => console.error('Error in tree stream:', error),
    );
  }

  async getTreesWithDetails(farmId: string, limitCount: number = 5): Promise<Record<string, any>[]> {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      orderBy('lastInspection', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async treeExists(farmId: string, treeId: string): Promise<boolean> {
    const docSnap = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
    return docSnap.exists();
  }

  // ─────────────────────────────────────────────────────────────
  // CLUSTER METHODS
  // ─────────────────────────────────────────────────────────────

  getTreesByCluster(farmId: string, cluster: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('cluster', '==', cluster),
      orderBy('lastInspection', 'desc'),
    );
    return onSnapshot(q, callback);
  }

  getClusters(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(collection(db, 'farms', farmId, 'clusters'), orderBy('name'));
    return onSnapshot(q, callback);
  }

  async getClustersList(farmId: string): Promise<string[]> {
    const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
    const clusters = new Set<string>();
    snapshot.docs.forEach(d => clusters.add(d.data().cluster || 'Default'));
    return Array.from(clusters).sort();
  }

  async updateTreeCluster(farmId: string, treeId: string, newCluster: string): Promise<void> {
    return this.updateTree(farmId, treeId, { cluster: newCluster });
  }

  async batchUpdateTreesCluster(farmId: string, treeIds: string[], cluster: string): Promise<void> {
    const batch = writeBatch(db);
    for (const treeId of treeIds) {
      batch.update(doc(db, 'farms', farmId, 'trees', treeId), {
        cluster,
        lastInspection: serverTimestamp(),
      });
    }
    await batch.commit();
    await this._updateClusterStats(farmId, cluster);
    console.log('✅ Batch updated', treeIds.length, 'trees to cluster:', cluster);
  }

  async getClusterStatistics(farmId: string, cluster: string): Promise<Record<string, any>> {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('cluster', '==', cluster),
    );
    const snapshot = await getDocs(q);

    let healthyTrees = 0;
    let flaggedTrees = 0;

    snapshot.docs.forEach(d => {
      const data = d.data();
      if (data.healthStatus === 'Healthy') healthyTrees++;
      if (data.flagged === true) flaggedTrees++;
    });

    return {
      totalTrees: snapshot.docs.length,
      healthyTrees,
      flaggedTrees,
      healthPercentage: snapshot.docs.length > 0 ? (healthyTrees / snapshot.docs.length * 100) : 0,
    };
  }

  async addCluster(farmId: string, clusterName: string): Promise<void> {
    const clusterRef = doc(db, 'farms', farmId, 'clusters', clusterName);
    const clusterDoc = await getDoc(clusterRef);
    if (!clusterDoc.exists()) {
      await setDoc(clusterRef, {
        name: clusterName,
        createdAt: serverTimestamp(),
        treeCount: 0,
        healthyCount: 0,
        infectedCount: 0,
        avgInfectionRate: 0, 
        avgAge: 0,
        avgHeight: 0,
        avgCanopySpread: 0,
        avgLastYield: 0,
        totalMissedSprayings: 0,
        varieties: [],
        lastUpdated: serverTimestamp(),
      });
      console.log('✅ Cluster added:', clusterName);
    } else {
      throw new Error(`Cluster "${clusterName}" already exists`);
    }
  }

  async deleteClusterFromCollection(farmId: string, clusterName: string): Promise<void> {
    await deleteDoc(doc(db, 'farms', farmId, 'clusters', clusterName));
    console.log('✅ Cluster deleted from collection:', clusterName);
  }

  async getClustersFromCollection(farmId: string): Promise<string[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'farms', farmId, 'clusters'), orderBy('name')),
      );
      return snapshot.docs.map(d => d.id);
    } catch {
      return this.getClustersList(farmId);
    }
  }

  getClustersStream(farmId: string, callback: (clusters: string[]) => void): Unsubscribe {
    const q = query(collection(db, 'farms', farmId, 'clusters'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.id));
    });
  }

  /**
   * Stream cluster documents WITH full stats (for yield prediction).
   */
  getClustersWithStatsStream(
    farmId: string,
    callback: (clusters: Record<string, any>[]) => void,
  ): Unsubscribe {
    const q = query(collection(db, 'farms', farmId, 'clusters'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }

  async renameCluster(farmId: string, oldName: string, newName: string): Promise<void> {
    const batch = writeBatch(db);

    // Read old cluster doc to preserve stats
    const oldClusterDoc = await getDoc(doc(db, 'farms', farmId, 'clusters', oldName));
    const oldData = oldClusterDoc.exists() ? oldClusterDoc.data() : {};

    batch.delete(doc(db, 'farms', farmId, 'clusters', oldName));
    batch.set(doc(db, 'farms', farmId, 'clusters', newName), {
      ...oldData,
      name: newName,
      createdAt: serverTimestamp(),
    });

    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('cluster', '==', oldName),
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => batch.update(d.ref, { cluster: newName }));

    await batch.commit();
    console.log('✅ Cluster renamed:', oldName, '->', newName);
  }

  async migrateExistingTreesToCluster(farmId: string): Promise<void> {
    const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach(d => {
      if (!d.data().hasOwnProperty('cluster')) {
        batch.update(d.ref, { cluster: 'Default' });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log('✅ Migrated', updateCount, 'trees to include cluster field');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // VARIETY METHODS
  // ─────────────────────────────────────────────────────────────

  getTreesByVariety(farmId: string, variety: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('variety', '==', variety),
      orderBy('tree_name'),
    );
    return onSnapshot(q, callback);
  }

  async getVarietiesList(farmId: string): Promise<string[]> {
    const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
    const varieties = new Set<string>();
    snapshot.docs.forEach(d => {
      const v = d.data().variety;
      if (v) varieties.add(v);
    });
    return Array.from(varieties).sort();
  }

  async getVarietyDistribution(farmId: string): Promise<Record<string, number>> {
    const snapshot = await getDocs(collection(db, 'farms', farmId, 'trees'));
    const distribution: Record<string, number> = {};
    snapshot.docs.forEach(d => {
      const variety = d.data().variety || 'unknown';
      distribution[variety] = (distribution[variety] || 0) + 1;
    });
    return distribution;
  }

  // ─────────────────────────────────────────────────────────────
  // ── NEW: HARVEST RECORDS
  // ─────────────────────────────────────────────────────────────

  /**
   * Record a harvest for a cluster.
   * Also back-writes `lastYield` to each tree in the cluster
   * and recomputes cluster stats.
   */
  async recordHarvest(farmId: string, harvest: Omit<HarvestRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const harvestRef = await addDoc(
        collection(db, 'farms', farmId, 'harvests'),
        {
          ...harvest,
          harvestDate: harvest.harvestDate instanceof Date
            ? Timestamp.fromDate(harvest.harvestDate)
            : harvest.harvestDate,
          createdAt: serverTimestamp(),
        },
      );

      // Back-write lastYield to every tree in this cluster
      await this._backfillLastYieldToCluster(farmId, harvest.clusterId, harvest.clusterName, harvest.kgPerTree);

      // Recompute cluster stats (lastYield average changes)
      await this._updateClusterStats(farmId, harvest.clusterName);

      console.log('✅ Harvest recorded:', harvestRef.id);
      return harvestRef.id;
    } catch (error) {
      console.error('❌ Error recording harvest:', error);
      throw error;
    }
  }

  getHarvestsStream(
    farmId: string,
    callback: (harvests: HarvestRecord[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'harvests'),
      orderBy('harvestDate', 'desc'),
      limit(50),
    );

    return onSnapshot(q, (snapshot) => {
      const harvests: HarvestRecord[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          farmId,
          clusterId: data.clusterId,
          clusterName: data.clusterName,
          harvestDate: data.harvestDate?.toDate?.() ?? new Date(),
          totalKg: data.totalKg,
          kgPerTree: data.kgPerTree,
          treeCount: data.treeCount,
          variety: data.variety,
          notes: data.notes,
          recordedBy: data.recordedBy,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      });
      callback(harvests);
    });
  }

  getClusterHarvestsStream(
    farmId: string,
    clusterId: string,
    callback: (harvests: HarvestRecord[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'harvests'),
      where('clusterId', '==', clusterId),
      orderBy('harvestDate', 'desc'),
    );

    return onSnapshot(q, (snapshot) => {
      const harvests: HarvestRecord[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          farmId,
          clusterId: data.clusterId,
          clusterName: data.clusterName,
          harvestDate: data.harvestDate?.toDate?.() ?? new Date(),
          totalKg: data.totalKg,
          kgPerTree: data.kgPerTree,
          treeCount: data.treeCount,
          variety: data.variety,
          notes: data.notes,
          recordedBy: data.recordedBy,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      });
      callback(harvests);
    });
  }

  async deleteHarvest(farmId: string, harvestId: string): Promise<void> {
    await deleteDoc(doc(db, 'farms', farmId, 'harvests', harvestId));
  }

  // ─────────────────────────────────────────────────────────────
  // ── NEW: MISSED SPRAYINGS SYNC
  // ─────────────────────────────────────────────────────────────

  /**
   * Recomputes missedSprayings for every tree in a cluster by
   * counting incomplete spraying tasks in the last 90 days.
   * Call this from the task system whenever a task is completed/updated.
   */
  async syncMissedSprayingsForCluster(farmId: string, clusterName: string): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Count incomplete spraying tasks for this cluster in last 90 days
      const tasksQuery = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('cluster', '==', clusterName),
        where('type', '==', 'spraying'),
        where('status', '==', 'incomplete'),
        where('dueDate', '>=', Timestamp.fromDate(ninetyDaysAgo)),
      );

      const tasksSnapshot = await getDocs(tasksQuery);
      const missedCount = tasksSnapshot.docs.length;

      // Write this count to every tree in the cluster
      const treesQuery = query(
        collection(db, 'farms', farmId, 'trees'),
        where('cluster', '==', clusterName),
      );
      const treesSnapshot = await getDocs(treesQuery);

      const batch = writeBatch(db);
      treesSnapshot.docs.forEach(d => {
        batch.update(d.ref, { missedSprayings: missedCount });
      });
      await batch.commit();

      // Recompute cluster stats
      await this._updateClusterStats(farmId, clusterName);

      console.log(`✅ Synced missedSprayings (${missedCount}) for cluster: ${clusterName}`);
    } catch (error) {
      console.error('❌ Error syncing missed sprayings:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ── PRIVATE: CLUSTER STATS AGGREGATION
  // ─────────────────────────────────────────────────────────────

  /**
   * Core aggregation — reads all trees in a cluster and writes
   * pre-computed stats back to the cluster document.
   * Called after every add/update/delete/harvest/spray sync.
   */
  private async _updateClusterStats(farmId: string, clusterName: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('cluster', '==', clusterName),
      );
      const snapshot = await getDocs(q);

      const trees = snapshot.docs.map(d => d.data());
      const total = trees.length;

      if (total === 0) {
        // Cluster exists but has no trees — write zeroed stats
        const clusterRef = doc(db, 'farms', farmId, 'clusters', clusterName);
        const clusterDoc = await getDoc(clusterRef);
        if (clusterDoc.exists()) {
          await updateDoc(clusterRef, {
            treeCount: 0,
            healthyCount: 0,
            infectedCount: 0,
            avgAge: 0,
            avgHeight: 0,
            avgCanopySpread: 0,
            avgLastYield: 0,
            totalMissedSprayings: 0,
            varieties: [],
            lastUpdated: serverTimestamp(),
          });
        }
        return;
      }

      // Health counts
      let healthyCount = 0;
      let infectedCount = 0;

      // Agronomic sums (for averaging, only count trees that have the field)
      let ageSum = 0; let ageCount = 0;
      let heightSum = 0; let heightCount = 0;
      let canopySum = 0; let canopyCount = 0;
      let yieldSum = 0; let yieldCount = 0;
      let totalMissedSprayings = 0;
      const varietySet = new Set<string>();

      for (const tree of trees) {
        const hs = (tree.healthStatus || '').toLowerCase();
        if (hs === 'healthy') healthyCount++;
        else if (hs === 'infected') infectedCount++;

        // Age: prefer stored `age`, else compute from plantedDate
        if (tree.age != null) {
          ageSum += tree.age; ageCount++;
        } else if (tree.plantedDate) {
          const planted = tree.plantedDate?.toDate?.() ?? new Date(tree.plantedDate);
          const years = Math.max(0, (Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24 * 365));
          ageSum += years; ageCount++;
        }

        if (tree.height != null) { heightSum += tree.height; heightCount++; }
        if (tree.canopySpread != null) { canopySum += tree.canopySpread; canopyCount++; }
        if (tree.lastYield != null) { yieldSum += tree.lastYield; yieldCount++; }
        if (tree.missedSprayings != null) totalMissedSprayings += tree.missedSprayings;
        if (tree.variety) varietySet.add(tree.variety);
      }

      const stats = {
        treeCount: total,
        healthyCount,
        infectedCount,
        avgInfectionRate: Math.round((infectedCount / total) * 1000) / 1000,  // ← add this line
        avgAge: ageCount > 0 ? Math.round((ageSum / ageCount) * 10) / 10 : 0,
        avgHeight: heightCount > 0 ? Math.round((heightSum / heightCount) * 10) / 10 : 0,
        avgCanopySpread: canopyCount > 0 ? Math.round((canopySum / canopyCount) * 10) / 10 : 0,
        avgLastYield: yieldCount > 0 ? Math.round((yieldSum / yieldCount) * 10) / 10 : 0,
        totalMissedSprayings,
        varieties: Array.from(varietySet).sort(),
        lastUpdated: serverTimestamp(),
      };

      // Upsert the cluster document with new stats
      await setDoc(
        doc(db, 'farms', farmId, 'clusters', clusterName),
        stats,
        { merge: true },
      );

      console.log(`📊 Cluster stats updated — ${clusterName}: ${total} trees`);
    } catch (error) {
      console.error('❌ Error updating cluster stats:', error);
    }
  }

  /**
   * After a harvest, write `lastYield = kgPerTree` to all trees in the cluster
   * so that future cluster stat aggregations use real data.
   */
  private async _backfillLastYieldToCluster(
    farmId: string,
    _clusterId: string,
    clusterName: string,
    kgPerTree: number,
  ): Promise<void> {
    const q = query(
      collection(db, 'farms', farmId, 'trees'),
      where('cluster', '==', clusterName),
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { lastYield: kgPerTree });
    });
    await batch.commit();
    console.log(`✅ Back-filled lastYield (${kgPerTree} kg/tree) to ${snapshot.docs.length} trees in ${clusterName}`);
  }

  /**
   * Recomputes stats for ALL clusters in a farm.
   * Useful for initial migration or admin tooling.
   */
  async recomputeAllClusterStats(farmId: string): Promise<void> {
    const clustersSnap = await getDocs(collection(db, 'farms', farmId, 'clusters'));
    const clusterNames = clustersSnap.docs.map(d => d.data().name || d.id);

    for (const name of clusterNames) {
      await this._updateClusterStats(farmId, name);
    }
    console.log('✅ Recomputed stats for', clusterNames.length, 'clusters');
  }
}

export const treeService = new TreeService();
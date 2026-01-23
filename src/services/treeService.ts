// src/services/treeService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Tree {
  id: string;
  farmId: string;
  type: string;
  healthStatus?: string;
  growthStage?: string;
  cluster?: string;
  flagged: boolean;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

class TreeService {
  async addTree(farmId: string, treeData: Omit<Tree, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const treesRef = collection(db, 'farms', farmId, 'trees');
    
    const docRef = await addDoc(treesRef, {
      ...treeData,
      farmId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  async getTree(farmId: string, treeId: string): Promise<Tree | null> {
    const treeRef = doc(db, 'farms', farmId, 'trees', treeId);
    const treeDoc = await getDoc(treeRef);

    if (!treeDoc.exists()) {
      return null;
    }

    const data = treeDoc.data();
    return {
      id: treeDoc.id,
      farmId,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Tree;
  }

  async getTrees(farmId: string): Promise<Tree[]> {
    const treesRef = collection(db, 'farms', farmId, 'trees');
    const snapshot = await getDocs(treesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Tree[];
  }

  async getFlaggedTrees(farmId: string): Promise<Tree[]> {
    const treesRef = collection(db, 'farms', farmId, 'trees');
    const q = query(treesRef, where('flagged', '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Tree[];
  }

  async getTreesByCluster(farmId: string, cluster: string): Promise<Tree[]> {
    const treesRef = collection(db, 'farms', farmId, 'trees');
    const q = query(treesRef, where('cluster', '==', cluster));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Tree[];
  }

  async updateTree(farmId: string, treeId: string, updates: Partial<Tree>): Promise<void> {
    const treeRef = doc(db, 'farms', farmId, 'trees', treeId);
    await updateDoc(treeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteTree(farmId: string, treeId: string): Promise<void> {
    const treeRef = doc(db, 'farms', farmId, 'trees', treeId);
    await deleteDoc(treeRef);
  }

  async flagTree(farmId: string, treeId: string, flagged: boolean): Promise<void> {
    await this.updateTree(farmId, treeId, { flagged });
  }

  async getClusters(farmId: string): Promise<string[]> {
    const treesRef = collection(db, 'farms', farmId, 'trees');
    const snapshot = await getDocs(treesRef);

    const clusters = new Set<string>();
    snapshot.docs.forEach(doc => {
      const cluster = doc.data().cluster;
      if (cluster) {
        clusters.add(cluster);
      }
    });

    return Array.from(clusters).sort();
  }

  async updateTreeCluster(farmId: string, treeId: string, cluster: string): Promise<void> {
    await this.updateTree(farmId, treeId, { cluster });
  }

  async batchUpdateTreesCluster(farmId: string, treeIds: string[], cluster: string): Promise<void> {
    const batch = writeBatch(db);

    treeIds.forEach(treeId => {
      const treeRef = doc(db, 'farms', farmId, 'trees', treeId);
      batch.update(treeRef, { 
        cluster,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  async getClusterStatistics(farmId: string, cluster: string): Promise<{
    totalTrees: number;
    healthyTrees: number;
    flaggedTrees: number;
  }> {
    const trees = await this.getTreesByCluster(farmId, cluster);
    
    return {
      totalTrees: trees.length,
      healthyTrees: trees.filter(t => t.healthStatus === 'healthy').length,
      flaggedTrees: trees.filter(t => t.flagged).length,
    };
  }

  async treeExists(farmId: string, treeId: string): Promise<boolean> {
    const tree = await this.getTree(farmId, treeId);
    return tree !== null;
  }
}

export const treeService = new TreeService();
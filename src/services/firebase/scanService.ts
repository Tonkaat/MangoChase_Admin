// src/services/firebase/scan-service.ts
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
  QuerySnapshot,
  Unsubscribe
} from './firebaseConfig';

export interface ScanData {
  userId?: string;
  imageUrl: string;
  detectedDisease: string;
  confidence: number;
  treeId?: string;
  timestamp?: any;
  [key: string]: any;
}

export class ScanService {
  
  async addScan(options: {
    farmId: string;
    imageUrl: string;
    detectedDisease: string;
    confidence: number;
    treeId?: string;
    additionalData?: Record<string, any>;
  }): Promise<string> {
    const { farmId, imageUrl, detectedDisease, confidence, treeId, additionalData } = options;
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    const scanData: Record<string, any> = {
      userId,
      imageUrl,
      detectedDisease,
      confidence,
      treeId: treeId || null,
      timestamp: serverTimestamp(),
      ...additionalData,
    };

    const scanRef = await addDoc(
      collection(db, 'farms', farmId, 'scans'),
      scanData
    );

    console.log('📸 Scan added:', scanRef.id, 'for disease:', detectedDisease, 'confidence:', confidence);
    return scanRef.id;
  }

  async updateScan(farmId: string, scanId: string, updates: Record<string, any>): Promise<void> {
    await updateDoc(
      doc(db, 'farms', farmId, 'scans', scanId),
      updates
    );
    
    console.log('📸 Scan updated:', scanId);
  }

  async deleteScan(farmId: string, scanId: string): Promise<void> {
    await deleteDoc(doc(db, 'farms', farmId, 'scans', scanId));
    console.log('🗑️ Scan deleted:', scanId);
  }

  getScans(farmId: string, callback: (snapshot: QuerySnapshot) => void, limitCount: number = 10): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'scans'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, callback);
  }

  getScansByTree(farmId: string, treeId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'scans'),
      where('treeId', '==', treeId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, callback);
  }

  async getScansByDisease(farmId: string, diseaseName: string): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'scans'),
        where('detectedDisease', '==', diseaseName),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error('Error getting scans by disease:', error);
      return [];
    }
  }

  async getLatestScanForTree(
    farmId: string,
    treeId: string
  ): Promise<Record<string, any> | null> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'scans'),
        where('treeId', '==', treeId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error('Error getting latest scan for tree:', error);
      throw error;
    }
  }

  async getRecentScansWithDetails(farmId: string, limitCount: number = 5): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'scans'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const scansWithDetails: Record<string, any>[] = [];

      // Process each scan and fetch tree details
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const treeId = data.treeId;
        
        let treeName = 'Unknown Tree';
        let location = 'Unknown Location';
        let treeType = 'Unknown';
        
        if (treeId) {
          try {
            const treeDoc = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
            if (treeDoc.exists()) {
              const treeData = treeDoc.data();
              // ⚠️ NOTE: Check if your Flutter uses 'name' or 'tree_name'
              treeName = treeData?.tree_name || treeData?.name || `Tree ${treeId}`;
              location = treeData?.location || 'Farm';
              treeType = treeData?.type || 'Unknown';
            }
          } catch (error) {
            console.error('Error fetching tree details:', error);
          }
        }

        scansWithDetails.push({
          id: docSnap.id,
          treeName,
          location,
          treeType,
          ...data,
        });
      }

      return scansWithDetails;
    } catch (error) {
      console.error('Error getting recent scans:', error);
      return [];
    }
  }

  // Enhanced scan analysis methods
  async getScanStatistics(farmId: string): Promise<Record<string, any>> {
    try {
      const q = query(collection(db, 'farms', farmId, 'scans'));
      const snapshot = await getDocs(q);
      
      let totalScans = 0;
      let scansByDisease: Record<string, number> = {};
      let scansByTree: Record<string, number> = {};
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      let recentScans = 0;
      let totalConfidence = 0;

      snapshot.docs.forEach(docSnap => {
        totalScans++;
        
        const data = docSnap.data();
        const disease = data.detectedDisease || 'unknown';
        const treeId = data.treeId || 'unknown';
        const timestamp = data.timestamp?.toDate?.() || new Date(0);
        const confidence = data.confidence || 0;

        // Count by disease
        scansByDisease[disease] = (scansByDisease[disease] || 0) + 1;
        
        // Count by tree
        scansByTree[treeId] = (scansByTree[treeId] || 0) + 1;
        
        // Count recent scans (last 7 days)
        if (timestamp > lastWeek) {
          recentScans++;
        }
        
        // Sum confidence for average
        totalConfidence += confidence;
      });

      // Get most common disease
      let mostCommonDisease = 'None';
      let maxCount = 0;
      Object.entries(scansByDisease).forEach(([disease, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonDisease = disease;
        }
      });

      // Get most scanned tree
      let mostScannedTree = 'None';
      let maxTreeCount = 0;
      Object.entries(scansByTree).forEach(([treeId, count]) => {
        if (count > maxTreeCount && treeId !== 'unknown') {
          maxTreeCount = count;
          mostScannedTree = treeId;
        }
      });

      const avgConfidence = totalScans > 0 ? totalConfidence / totalScans : 0;

      return {
        totalScans,
        recentScans,
        mostCommonDisease,
        mostCommonDiseaseCount: maxCount,
        mostScannedTree,
        mostScannedTreeCount: maxTreeCount,
        avgConfidence: parseFloat(avgConfidence.toFixed(2)),
        scansByDisease,
        scansByTree,
      };
    } catch (error) {
      console.error('Error getting scan statistics:', error);
      return {
        totalScans: 0,
        recentScans: 0,
        mostCommonDisease: 'None',
        mostCommonDiseaseCount: 0,
        mostScannedTree: 'None',
        mostScannedTreeCount: 0,
        avgConfidence: 0,
        scansByDisease: {},
        scansByTree: {},
      };
    }
  }

  async getConfidenceDistribution(farmId: string): Promise<{
    high: number;      // 80-100%
    medium: number;    // 60-79%
    low: number;       // 0-59%
  }> {
    try {
      const q = query(collection(db, 'farms', farmId, 'scans'));
      const snapshot = await getDocs(q);
      
      let high = 0;
      let medium = 0;
      let low = 0;

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const confidence = data.confidence || 0;
        
        if (confidence >= 0.8) {
          high++;
        } else if (confidence >= 0.6) {
          medium++;
        } else {
          low++;
        }
      });

      return { high, medium, low };
    } catch (error) {
      console.error('Error getting confidence distribution:', error);
      return { high: 0, medium: 0, low: 0 };
    }
  }

  async getScansByDateRange(farmId: string, startDate: Date, endDate: Date): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'scans'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error('Error getting scans by date range:', error);
      return [];
    }
  }

  async getDiseaseTrends(farmId: string, days: number = 30): Promise<Record<string, any>[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const q = query(
        collection(db, 'farms', farmId, 'scans'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const trendsByDate: Record<string, Record<string, number>> = {};

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const disease = data.detectedDisease || 'unknown';
        const timestamp = data.timestamp?.toDate?.() || new Date(0);
        const dateKey = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!trendsByDate[dateKey]) {
          trendsByDate[dateKey] = {};
        }
        
        trendsByDate[dateKey][disease] = (trendsByDate[dateKey][disease] || 0) + 1;
      });

      // Convert to array format
      return Object.entries(trendsByDate).map(([date, diseases]) => ({
        date,
        ...diseases,
      }));
    } catch (error) {
      console.error('Error getting disease trends:', error);
      return [];
    }
  }

  // Get stream of scan statistics
  getScanStatsStream(farmId: string, callback: (stats: Record<string, any>) => void): Unsubscribe {
    return this.getScans(farmId, async (snapshot) => {
      const stats = await this.getScanStatistics(farmId);
      callback(stats);
    }, 1000); // Limit to 1000 scans for performance
  }
}

// Export singleton instance
export const scanService = new ScanService();
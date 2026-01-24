// src/services/firebase/query-service.ts
import { 
  db, 
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentSnapshot
} from './firebaseConfig';

export class QueryService {
  
  getStatisticsLive(farmId: string, callback: (data: Record<string, any>) => void): () => void {
    return onSnapshot(
      doc(db, 'farms', farmId, 'statistics', 'stats'),
      (docSnap: DocumentSnapshot) => {
        if (!docSnap.exists()) {
          callback({
            totalTrees: 0,
            healthyTrees: 0,
            flaggedTrees: 0,
            avgYield: 0,
          });
        } else {
          callback(docSnap.data() || {});
        }
      },
      (error) => {
        console.error('Error in statistics live stream:', error);
        callback({
          totalTrees: 0,
          healthyTrees: 0,
          flaggedTrees: 0,
          avgYield: 0,
        });
      }
    );
  }

  async getDashboardSummary(farmId: string): Promise<Record<string, any>> {
    try {
      // Get statistics
      const statsDoc = await getDoc(doc(db, 'farms', farmId, 'statistics', 'stats'));
      
      const stats = statsDoc.exists() ? (statsDoc.data() || {}) : {
        totalTrees: 0,
        healthyTrees: 0,
        flaggedTrees: 0,
        avgYield: 0,
      };

      // Get pending tasks count
      const pendingTasksQuery = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('status', '==', 'pending')
      );
      
      const pendingTasksSnapshot = await getDocs(pendingTasksQuery);
      const pendingTasksCount = pendingTasksSnapshot.docs.length;

      // Get recent scans
      const recentScans = await this._getRecentScansWithDetails(farmId, 3);

      // Get today's tasks
      const todayTasks = await this._getTodayTasksList(farmId);

      return {
        statistics: stats,
        pendingTasksCount,
        recentScans,
        todayTasks,
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        statistics: {},
        pendingTasksCount: 0,
        recentScans: [],
        todayTasks: [],
      };
    }
  }

  private async _getRecentScansWithDetails(farmId: string, limitCount: number = 5): Promise<Record<string, any>[]> {
    try {
      const scansQuery = query(
        collection(db, 'farms', farmId, 'scans'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(scansQuery);
      const scansWithDetails: Record<string, any>[] = [];

      // Process each scan and fetch tree details
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const treeId = data.treeId;
        
        let treeName = 'Unknown Tree';
        let location = 'Unknown Location';
        
        if (treeId) {
          try {
            const treeDoc = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
            if (treeDoc.exists()) {
              const treeData = treeDoc.data();
              // ⚠️ NOTE: In Flutter it's treeData['name'], but your TreeService uses 'tree_name'
              // Check which field name your Flutter app actually uses
              treeName = treeData?.tree_name || treeData?.name || `Tree ${treeId}`;
              location = treeData?.location || 'Farm';
            }
          } catch (error) {
            console.error('Error fetching tree details:', error);
          }
        }

        scansWithDetails.push({
          id: docSnap.id,
          treeName,
          location,
          ...data,
        });
      }

      return scansWithDetails;
    } catch (error) {
      console.error('Error getting recent scans:', error);
      return [];
    }
  }

  private async _getTodayTasksList(farmId: string): Promise<Record<string, any>[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    try {
      const tasksQuery = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
        where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dueDate')
      );
      
      const snapshot = await getDocs(tasksQuery);
      
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error('Error getting today tasks:', error);
      return [];
    }
  }

  // Additional query methods you might need
  async getFarmOverview(farmId: string): Promise<Record<string, any>> {
    try {
      const [stats, tasks, recentActivity] = await Promise.all([
        this.getStatisticsLiveSnapshot(farmId),
        this.getUpcomingTasks(farmId, 5),
        this.getRecentActivity(farmId, 10)
      ]);

      return {
        ...stats,
        upcomingTasks: tasks,
        recentActivity,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting farm overview:', error);
      return {
        totalTrees: 0,
        healthyTrees: 0,
        flaggedTrees: 0,
        upcomingTasks: [],
        recentActivity: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async getStatisticsLiveSnapshot(farmId: string): Promise<Record<string, any>> {
    const statsDoc = await getDoc(doc(db, 'farms', farmId, 'statistics', 'stats'));
    return statsDoc.exists() ? (statsDoc.data() || {}) : {
      totalTrees: 0,
      healthyTrees: 0,
      flaggedTrees: 0,
      avgYield: 0,
    };
  }

  private async getUpcomingTasks(farmId: string, limitCount: number): Promise<Record<string, any>[]> {
    try {
      const now = new Date();
      const tasksQuery = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('dueDate', '>=', Timestamp.fromDate(now)),
        where('status', '==', 'pending'),
        orderBy('dueDate'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(tasksQuery);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error('Error getting upcoming tasks:', error);
      return [];
    }
  }

  private async getRecentActivity(farmId: string, limitCount: number): Promise<Record<string, any>[]> {
    try {
      // Get recent journal entries
      const journalQuery = query(
        collection(db, 'farms', farmId, 'journal'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const journalSnapshot = await getDocs(journalQuery);
      const activities = journalSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        type: 'journal',
        ...docSnap.data()
      }));

      // Get recent scans
      const scansQuery = query(
        collection(db, 'farms', farmId, 'scans'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const scansSnapshot = await getDocs(scansQuery);
      const scanActivities = scansSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        type: 'scan',
        ...docSnap.data()
      }));

      // Combine and sort by timestamp
      const allActivities = [...activities, ...scanActivities];
      allActivities.sort((a, b) => {
        const aTime = (a as any).timestamp?.toDate?.() || new Date(0);
        const bTime = (b as any).timestamp?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      return allActivities.slice(0, limitCount);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }
}

// Export singleton instance
export const queryService = new QueryService();
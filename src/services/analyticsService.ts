// src/services/analyticsService.ts
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DashboardStats {
  totalTrees: number;
  healthyTrees: number;
  flaggedTrees: number;
  pendingTasks: number;
  completedTasks: number;
  todayTasks: number;
  recentScans: number;
  healthDistribution: {
    healthy: number;
    moderate: number;
    critical: number;
  };
  taskCompletion: {
    completed: number;
    pending: number;
    inProgress: number;
  };
}

export interface HealthTrend {
  date: string;
  healthy: number;
  moderate: number;
  critical: number;
}

export interface YieldData {
  month: string;
  predicted: number;
  actual: number;
}

class AnalyticsService {
  async getDashboardStats(farmId: string): Promise<DashboardStats> {
    // Get all trees
    const treesSnapshot = await getDocs(
      collection(db, 'farms', farmId, 'trees')
    );
    const trees = treesSnapshot.docs.map(doc => doc.data());

    // Calculate tree statistics
    const totalTrees = trees.length;
    const healthyTrees = trees.filter(t => t.healthStatus === 'healthy').length;
    const flaggedTrees = trees.filter(t => t.flagged === true).length;
    
    const moderateTrees = trees.filter(t => t.healthStatus === 'moderate').length;
    const criticalTrees = trees.filter(t => t.healthStatus === 'critical').length;

    // Get all tasks
    const tasksSnapshot = await getDocs(
      collection(db, 'farms', farmId, 'tasks')
    );
    const tasks = tasksSnapshot.docs.map(doc => doc.data());

    // Calculate task statistics
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter(t => {
      const taskDate = (t.dueDate as Timestamp)?.toDate();
      return taskDate && taskDate >= today && taskDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;

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
      todayTasks,
      recentScans,
      healthDistribution: {
        healthy: healthyTrees,
        moderate: moderateTrees,
        critical: criticalTrees,
      },
      taskCompletion: {
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
      },
    };
  }

  async getHealthTrends(farmId: string, days: number = 30): Promise<HealthTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const journalSnapshot = await getDocs(
      query(
        collection(db, 'farms', farmId, 'journal'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'asc')
      )
    );

    // Group by date and calculate health status
    const trendMap = new Map<string, { healthy: number; moderate: number; critical: number }>();

    journalSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const date = (data.timestamp as Timestamp)?.toDate();
      if (date) {
        const dateKey = date.toISOString().split('T')[0];
        
        if (!trendMap.has(dateKey)) {
          trendMap.set(dateKey, { healthy: 0, moderate: 0, critical: 0 });
        }

        const trend = trendMap.get(dateKey)!;
        
        if (data.healthStatus === 'healthy') trend.healthy++;
        else if (data.healthStatus === 'moderate') trend.moderate++;
        else if (data.healthStatus === 'critical') trend.critical++;
      }
    });

    return Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  async getRecentActivity(farmId: string, limitCount: number = 10): Promise<any[]> {
    const journalSnapshot = await getDocs(
      query(
        collection(db, 'farms', farmId, 'journal'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
    );

    return journalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as Timestamp)?.toDate(),
    }));
  }

  async exportData(farmId: string, dataType: 'trees' | 'tasks' | 'scans'): Promise<any[]> {
    const snapshot = await getDocs(
      collection(db, 'farms', farmId, dataType)
    );

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}

export const analyticsService = new AnalyticsService();
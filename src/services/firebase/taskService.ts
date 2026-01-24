// src/services/firebase/task-service.ts
import { 
  db, 
  auth,
  serverTimestamp,
  Timestamp,
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
  QuerySnapshot,
  Unsubscribe
} from './firebaseConfig';

export class TaskService {
  
  async addTask(options: {
    farmId: string;
    title: string;
    dueDate: Date;
    assignedTo?: string;
    status?: string;
    description?: string;
    type?: string;
    clusterId?: string;
    clusterName?: string;
  }): Promise<string> {
    const { farmId, title, dueDate, assignedTo, status = 'pending', description, type, clusterId, clusterName } = options;
    
    const taskData: Record<string, any> = {
      title,
      assignedTo: assignedTo || auth.currentUser?.uid,
      dueDate: Timestamp.fromDate(dueDate),
      status,
      description: description || '',
      createdAt: serverTimestamp(),
    };

    if (type) taskData.type = type;
    taskData.clusterId = clusterId; // Store cluster assignment
    taskData.clusterName = clusterName || clusterId; // Store cluster name for display

    const taskRef = await addDoc(
      collection(db, 'farms', farmId, 'tasks'),
      taskData
    );

    console.log('✅ Task saved to Firestore:', title, 'type:', type, 'cluster:', clusterName || clusterId || 'All Clusters', 'dueDate:', dueDate);
    return taskRef.id;
  }

  async updateTask(farmId: string, taskId: string, updates: Record<string, any>): Promise<void> {
    await updateDoc(
      doc(db, 'farms', farmId, 'tasks', taskId),
      updates
    );
  }

  async updateTaskStatus(farmId: string, taskId: string, status: string): Promise<void> {
    const updates: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'done') {
      updates.completedAt = serverTimestamp();
    }

    await this.updateTask(farmId, taskId, updates);
  }

  async deleteTask(farmId: string, taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'farms', farmId, 'tasks', taskId));
  }

  getTasks(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    console.log('🔄 Listening for tasks in farm:', farmId);
    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  getTasksByStatus(farmId: string, status: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      where('status', '==', status),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  getMyTasks(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      where('assignedTo', '==', userId),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  getTasksByDate(farmId: string, date: Date, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
      where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  // ==========================================
  // CLUSTER-SPECIFIC METHODS
  // ==========================================

  getTasksByCluster(farmId: string, clusterId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    console.log('🔄 Listening for tasks in cluster:', clusterId);
    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      where('clusterId', '==', clusterId),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  getFarmWideTasks(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    console.log('🔄 Listening for farm-wide tasks');
    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      where('clusterId', '==', null),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  async getRelevantTasksForCluster(farmId: string, clusterId: string): Promise<Record<string, any>[]> {
    try {
      // Get cluster-specific tasks
      const clusterTasksQuery = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('clusterId', '==', clusterId),
        orderBy('dueDate')
      );
      
      const clusterTasks = await getDocs(clusterTasksQuery);

      // Get farm-wide tasks
      const farmWideTasksQuery = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('clusterId', '==', null),
        orderBy('dueDate')
      );
      
      const farmWideTasks = await getDocs(farmWideTasksQuery);

      // Combine both lists
      const allTasks = [
        ...clusterTasks.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...farmWideTasks.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ];

      // Sort by due date
      allTasks.sort((a, b) => {
        const aDate = ((a as Record<string, any>).dueDate as Timestamp).toDate();
        const bDate = ((b as Record<string, any>).dueDate as Timestamp).toDate();
        return aDate.getTime() - bDate.getTime();
      });

      console.log(`📋 Found ${allTasks.length} tasks for cluster ${clusterId} (${clusterTasks.docs.length} cluster-specific + ${farmWideTasks.docs.length} farm-wide)`);
      return allTasks;
    } catch (error) {
      console.error('❌ Error getting relevant tasks for cluster:', error);
      return [];
    }
  }

  getClusterTasksByDate(farmId: string, clusterId: string, date: Date, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const q = query(
      collection(db, 'farms', farmId, 'tasks'),
      where('clusterId', '==', clusterId),
      where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
      where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('dueDate')
    );
    
    return onSnapshot(q, callback);
  }

  async getPendingTasksCountForCluster(farmId: string, clusterId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('clusterId', '==', clusterId),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error getting pending tasks count for cluster:', error);
      return 0;
    }
  }

  async updateTaskCluster(farmId: string, taskId: string, newClusterId?: string): Promise<void> {
    await updateDoc(
      doc(db, 'farms', farmId, 'tasks', taskId),
      {
        clusterId: newClusterId,
        updatedAt: serverTimestamp(),
      }
    );
    
    console.log(`✅ Task ${taskId} moved to cluster: ${newClusterId || 'All Clusters'}`);
  }

  async batchUpdateTasksCluster(farmId: string, taskIds: string[], clusterId?: string): Promise<void> {
    const batch = writeBatch(db);

    for (const taskId of taskIds) {
      const taskRef = doc(db, 'farms', farmId, 'tasks', taskId);
      batch.update(taskRef, {
        clusterId: clusterId,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`✅ Batch updated ${taskIds.length} tasks to cluster: ${clusterId || 'All Clusters'}`);
  }

  // ==========================================
  // EXISTING METHODS
  // ==========================================

  async getPendingTasksCount(farmId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error getting pending tasks count:', error);
      return 0;
    }
  }

  async getTodayTasksList(farmId: string): Promise<Record<string, any>[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    try {
      const q = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
        where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dueDate')
      );
      
      const snapshot = await getDocs(q);
      console.log('📅 Found', snapshot.docs.length, 'tasks for today');
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting today tasks:', error);
      return [];
    }
  }

  async getTasksInDateRange(farmId: string, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Record<string, any>[]> {
    try {
      const start = options?.startDate || new Date();
      const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      
      const end = options?.endDate || new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

      const q = query(
        collection(db, 'farms', farmId, 'tasks'),
        where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
        where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('dueDate')
      );
      
      const snapshot = await getDocs(q);
      
      console.log(`📅 Found ${snapshot.docs.length} tasks between ${startOfDay.toISOString().split('T')[0]} and ${endOfDay.toISOString().split('T')[0]}`);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting tasks in date range:', error);
      return [];
    }
  }

  async getAllTasks(farmId: string): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'tasks'),
        orderBy('dueDate', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      console.log('📋 Found', snapshot.docs.length, 'total tasks');
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting all tasks:', error);
      return [];
    }
  }

  async batchUpdateTasks(farmId: string, taskIds: string[], updates: Record<string, any>): Promise<void> {
    const batch = writeBatch(db);

    for (const taskId of taskIds) {
      const taskRef = doc(db, 'farms', farmId, 'tasks', taskId);
      batch.update(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }
}

// Export singleton instance
export const taskService = new TaskService();
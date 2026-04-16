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
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  QuerySnapshot,
  Unsubscribe,
} from './firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddTaskOptions {
  farmId: string;
  title: string;
  dueDate: Date;
  assignedTo?: string;
  status?: string;
  description?: string;
  type?: string;
  /**
   * Pass `null` explicitly to store farm-wide tasks.
   * Omit or pass `undefined` to also store as null (farm-wide).
   * Pass a non-empty string for cluster-specific tasks.
   *
   * IMPORTANT: We always write `clusterId` to Firestore (never omit the field)
   * so that `where('clusterId', '==', null)` queries work correctly.
   */
  clusterId?: string | null;
  clusterName?: string | null;
  notes?: string;
  priority?: string;
  isAIGenerated?: boolean;
}

// ─── TaskService ──────────────────────────────────────────────────────────────

export class TaskService {
  // ── Helpers ────────────────────────────────────────────────────────────────

  private tasksRef(farmId: string) {
    return collection(db, 'farms', farmId, 'tasks');
  }

  private taskDoc(farmId: string, taskId: string) {
    return doc(db, 'farms', farmId, 'tasks', taskId);
  }

  /**
   * Normalise clusterId: empty string → null so Firestore equality queries
   * (`where('clusterId', '==', null)`) work for farm-wide tasks.
   */
  private normaliseClusterId(clusterId?: string | null): string | null {
    if (!clusterId || clusterId.trim() === '') return null;
    return clusterId.trim();
  }

  private buildTaskData(options: Omit<AddTaskOptions, 'farmId'>) {
    const {
      title,
      dueDate,
      assignedTo,
      status = 'pending',
      description = '',
      type,
      clusterId,
      clusterName,
      notes,
      priority = 'medium',
      isAIGenerated = false,
    } = options;

    const normalisedClusterId = this.normaliseClusterId(clusterId);

    return {
      title,
      assignedTo: assignedTo ?? auth.currentUser?.uid ?? null,
      dueDate: Timestamp.fromDate(dueDate),
      status,
      description,
      priority,
      isAIGenerated,
      notes: notes ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Always write the field — even as null — so range/equality queries work
      clusterId: normalisedClusterId,
      clusterName: normalisedClusterId ? (clusterName ?? normalisedClusterId) : null,
      ...(type ? { type } : {}),
    };
  }

  // ── Single task ─────────────────────────────────────────────────────────────

  async addTask(options: AddTaskOptions): Promise<string> {
    const { farmId, ...rest } = options;
    const taskData = this.buildTaskData(rest);

    const taskRef = await addDoc(this.tasksRef(farmId), taskData);

    console.log(
      '✅ Task saved:',
      options.title,
      '| type:', options.type ?? 'general',
      '| cluster:', options.clusterId || 'All Clusters',
    );

    return taskRef.id;
  }

  // ── Batch create (one task per cluster) ────────────────────────────────────

  /**
   * Creates one task per entry in `perClusterOptions` inside a single Firestore
   * batch write (max 500 ops — well within typical cluster counts).
   *
   * Returns the generated task IDs in the same order as the input array.
   */
  async addTasksBatch(
    farmId: string,
    perClusterOptions: Array<Omit<AddTaskOptions, 'farmId'>>,
  ): Promise<string[]> {
    if (perClusterOptions.length === 0) return [];

    // Firestore batch can hold 500 writes max
    if (perClusterOptions.length > 500) {
      throw new Error('Cannot create more than 500 tasks in a single batch.');
    }

    const batch = writeBatch(db);
    const refs = perClusterOptions.map(() => doc(this.tasksRef(farmId)));

    perClusterOptions.forEach((opts, i) => {
      batch.set(refs[i], this.buildTaskData(opts));
    });

    await batch.commit();

    console.log(`✅ Batch created ${perClusterOptions.length} tasks for farm ${farmId}`);
    return refs.map((r) => r.id);
  }

  // ── Update / Delete ─────────────────────────────────────────────────────────

  async updateTask(farmId: string, taskId: string, updates: Record<string, any>): Promise<void> {
    await updateDoc(this.taskDoc(farmId, taskId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async updateTaskStatus(farmId: string, taskId: string, status: string): Promise<void> {
    await this.updateTask(farmId, taskId, {
      status,
      ...(status === 'done' ? { completedAt: serverTimestamp() } : {}),
    });
  }

  async deleteTask(farmId: string, taskId: string): Promise<void> {
    await deleteDoc(this.taskDoc(farmId, taskId));
  }

  // ── Real-time listeners ─────────────────────────────────────────────────────

  /**
   * Subscribes to ALL tasks for a farm, ordered by dueDate.
   *
   * Optimisation note: for large farms, prefer `getTasksByDateRange` for
   * the calendar view and only pull a rolling window (e.g. ±30 days).
   */
  getTasks(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    console.log('🔄 Subscribing to all tasks — farm:', farmId);
    return onSnapshot(
      query(this.tasksRef(farmId), orderBy('dueDate')),
      callback,
    );
  }

  /**
   * Subscribes to tasks whose dueDate falls within [start, end].
   * Use this for the calendar view to avoid loading the full task list.
   */
  getTasksInWindow(
    farmId: string,
    start: Date,
    end: Date,
    callback: (snapshot: QuerySnapshot) => void,
  ): Unsubscribe {
    const q = query(
      this.tasksRef(farmId),
      where('dueDate', '>=', Timestamp.fromDate(start)),
      where('dueDate', '<=', Timestamp.fromDate(end)),
      orderBy('dueDate'),
    );
    return onSnapshot(q, callback);
  }

  getTasksByStatus(
    farmId: string,
    status: string,
    callback: (snapshot: QuerySnapshot) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        this.tasksRef(farmId),
        where('status', '==', status),
        orderBy('dueDate'),
      ),
      callback,
    );
  }

  getMyTasks(farmId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');

    return onSnapshot(
      query(
        this.tasksRef(farmId),
        where('assignedTo', '==', userId),
        orderBy('dueDate'),
      ),
      callback,
    );
  }

  getTasksByDate(
    farmId: string,
    date: Date,
    callback: (snapshot: QuerySnapshot) => void,
  ): Unsubscribe {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return onSnapshot(
      query(
        this.tasksRef(farmId),
        where('dueDate', '>=', Timestamp.fromDate(start)),
        where('dueDate', '<=', Timestamp.fromDate(end)),
        orderBy('dueDate'),
      ),
      callback,
    );
  }

  // ── Cluster-specific listeners ──────────────────────────────────────────────

  getTasksByCluster(
    farmId: string,
    clusterId: string,
    callback: (snapshot: QuerySnapshot) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        this.tasksRef(farmId),
        where('clusterId', '==', clusterId),
        orderBy('dueDate'),
      ),
      callback,
    );
  }

  /**
   * Farm-wide tasks: clusterId is stored as `null` (not missing / undefined).
   * This works because `buildTaskData` always writes the `clusterId` field.
   */
  getFarmWideTasks(
    farmId: string,
    callback: (snapshot: QuerySnapshot) => void,
  ): Unsubscribe {
    return onSnapshot(
      query(
        this.tasksRef(farmId),
        where('clusterId', '==', null),
        orderBy('dueDate'),
      ),
      callback,
    );
  }

  getClusterTasksByDate(
    farmId: string,
    clusterId: string,
    date: Date,
    callback: (snapshot: QuerySnapshot) => void,
  ): Unsubscribe {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    return onSnapshot(
      query(
        this.tasksRef(farmId),
        where('clusterId', '==', clusterId),
        where('dueDate', '>=', Timestamp.fromDate(start)),
        where('dueDate', '<=', Timestamp.fromDate(end)),
        orderBy('dueDate'),
      ),
      callback,
    );
  }

  // ── One-shot fetches ────────────────────────────────────────────────────────

  async getRelevantTasksForCluster(
    farmId: string,
    clusterId: string,
  ): Promise<Record<string, any>[]> {
    try {
      const [clusterSnap, farmWideSnap] = await Promise.all([
        getDocs(
          query(
            this.tasksRef(farmId),
            where('clusterId', '==', clusterId),
            orderBy('dueDate'),
          ),
        ),
        getDocs(
          query(
            this.tasksRef(farmId),
            where('clusterId', '==', null),
            orderBy('dueDate'),
          ),
        ),
      ]);

      const all = [
        ...clusterSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...farmWideSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ].sort((a: any, b: any) => {
        return (a.dueDate as Timestamp).toDate().getTime() -
               (b.dueDate as Timestamp).toDate().getTime();
      });

      console.log(
        `📋 ${all.length} tasks for cluster ${clusterId}`,
        `(${clusterSnap.size} cluster + ${farmWideSnap.size} farm-wide)`,
      );
      return all;
    } catch (error) {
      console.error('❌ getRelevantTasksForCluster:', error);
      return [];
    }
  }

  async getPendingTasksCount(farmId: string): Promise<number> {
    try {
      const snap = await getDocs(
        query(this.tasksRef(farmId), where('status', '==', 'pending')),
      );
      return snap.size;
    } catch {
      return 0;
    }
  }

  async getPendingTasksCountForCluster(farmId: string, clusterId: string): Promise<number> {
    try {
      const snap = await getDocs(
        query(
          this.tasksRef(farmId),
          where('clusterId', '==', clusterId),
          where('status', '==', 'pending'),
        ),
      );
      return snap.size;
    } catch {
      return 0;
    }
  }

  async getTodayTasksList(farmId: string): Promise<Record<string, any>[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    try {
      const snap = await getDocs(
        query(
          this.tasksRef(farmId),
          where('dueDate', '>=', Timestamp.fromDate(start)),
          where('dueDate', '<=', Timestamp.fromDate(end)),
          orderBy('dueDate'),
        ),
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ getTodayTasksList:', error);
      return [];
    }
  }

  async getTasksInDateRange(
    farmId: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<Record<string, any>[]> {
    try {
      const start = options?.startDate ?? new Date();
      const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const end = options?.endDate ?? new Date(start.getTime() + 7 * 86_400_000);
      const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

      const snap = await getDocs(
        query(
          this.tasksRef(farmId),
          where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
          where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('dueDate'),
        ),
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ getTasksInDateRange:', error);
      return [];
    }
  }

  async getAllTasks(farmId: string): Promise<Record<string, any>[]> {
    try {
      const snap = await getDocs(
        query(this.tasksRef(farmId), orderBy('dueDate', 'desc'), limit(100)),
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ getAllTasks:', error);
      return [];
    }
  }

  // ── Cluster management ──────────────────────────────────────────────────────

  async updateTaskCluster(
    farmId: string,
    taskId: string,
    newClusterId?: string | null,
  ): Promise<void> {
    const normalised = this.normaliseClusterId(newClusterId);
    await updateDoc(this.taskDoc(farmId, taskId), {
      clusterId: normalised,
      clusterName: normalised ?? null,
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Task ${taskId} → cluster: ${normalised ?? 'All Clusters'}`);
  }

  async batchUpdateTasksCluster(
    farmId: string,
    taskIds: string[],
    clusterId?: string | null,
  ): Promise<void> {
    const normalised = this.normaliseClusterId(clusterId);
    const batch = writeBatch(db);

    taskIds.forEach((id) => {
      batch.update(this.taskDoc(farmId, id), {
        clusterId: normalised,
        clusterName: normalised ?? null,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`✅ Batch updated ${taskIds.length} tasks → cluster: ${normalised ?? 'All Clusters'}`);
  }

  async batchUpdateTasks(
    farmId: string,
    taskIds: string[],
    updates: Record<string, any>,
  ): Promise<void> {
    const batch = writeBatch(db);
    taskIds.forEach((id) => {
      batch.update(this.taskDoc(farmId, id), { ...updates, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

// Singleton
export const taskService = new TaskService();
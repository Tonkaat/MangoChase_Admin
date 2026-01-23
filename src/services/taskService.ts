// src/services/taskService.ts
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
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Task {
  id: string;
  farmId: string;
  title: string;
  description?: string;
  type?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  clusterId?: string;
  clusterName?: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

class TaskService {
  async addTask(
    farmId: string,
    taskData: Omit<Task, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const tasksRef = collection(db, 'farms', farmId, 'tasks');
    
    const docRef = await addDoc(tasksRef, {
      ...taskData,
      farmId,
      dueDate: Timestamp.fromDate(taskData.dueDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  async getTask(farmId: string, taskId: string): Promise<Task | null> {
    const taskRef = doc(db, 'farms', farmId, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      return null;
    }

    const data = taskDoc.data();
    return {
      id: taskDoc.id,
      farmId,
      ...data,
      dueDate: (data.dueDate as Timestamp)?.toDate() || new Date(),
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
    } as Task;
  }

  async getTasks(farmId: string): Promise<Task[]> {
    const tasksRef = collection(db, 'farms', farmId, 'tasks');
    const q = query(tasksRef, orderBy('dueDate', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      dueDate: (doc.data().dueDate as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : undefined,
    })) as Task[];
  }

  async getTasksByStatus(farmId: string, status: string): Promise<Task[]> {
    const tasksRef = collection(db, 'farms', farmId, 'tasks');
    const q = query(
      tasksRef,
      where('status', '==', status),
      orderBy('dueDate', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      dueDate: (doc.data().dueDate as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : undefined,
    })) as Task[];
  }

  async getTasksByDate(farmId: string, date: Date): Promise<Task[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasksRef = collection(db, 'farms', farmId, 'tasks');
    const q = query(
      tasksRef,
      where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
      where('dueDate', '<=', Timestamp.fromDate(endOfDay))
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      dueDate: (doc.data().dueDate as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : undefined,
    })) as Task[];
  }

  async getTodayTasks(farmId: string): Promise<Task[]> {
    return this.getTasksByDate(farmId, new Date());
  }

  async updateTask(farmId: string, taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(db, 'farms', farmId, 'tasks', taskId);
    
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    if (updates.status === 'completed' && !updates.completedAt) {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(taskRef, updateData);
  }

  async updateTaskStatus(farmId: string, taskId: string, status: Task['status']): Promise<void> {
    await this.updateTask(farmId, taskId, { status });
  }

  async deleteTask(farmId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, 'farms', farmId, 'tasks', taskId);
    await deleteDoc(taskRef);
  }

  async getPendingTasksCount(farmId: string): Promise<number> {
    const tasks = await this.getTasksByStatus(farmId, 'pending');
    return tasks.length;
  }

  async batchUpdateTasks(
    farmId: string,
    taskIds: string[],
    updates: Partial<Task>
  ): Promise<void> {
    const batch = writeBatch(db);

    taskIds.forEach(taskId => {
      const taskRef = doc(db, 'farms', farmId, 'tasks', taskId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (updates.dueDate) {
        updateData.dueDate = Timestamp.fromDate(updates.dueDate);
      }

      batch.update(taskRef, updateData);
    });

    await batch.commit();
  }

  async getTasksInDateRange(
    farmId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Task[]> {
    const tasksRef = collection(db, 'farms', farmId, 'tasks');
    let q = query(tasksRef);

    if (startDate) {
      q = query(q, where('dueDate', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      q = query(q, where('dueDate', '<=', Timestamp.fromDate(endDate)));
    }

    q = query(q, orderBy('dueDate', 'asc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      farmId,
      ...doc.data(),
      dueDate: (doc.data().dueDate as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : undefined,
    })) as Task[];
  }
}

export const taskService = new TaskService();
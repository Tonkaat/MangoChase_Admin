// src/services/firebase/index.ts
import { 
  db, 
  auth,
  serverTimestamp,
  Timestamp,
  writeBatch,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from './firebaseConfig';
import { FirebaseAuthService } from './firebaseAuthService';
import { UserService } from './userService';
import { FarmService } from './farmService';
import { TreeService } from './treeService';
import { TaskService } from './taskService';
import { JournalService } from './journalService';
import { ScanService } from './scanService';
import { AIChatService } from './aiChatService';
import { QueryService } from './queryService';
import { TreeNamingService } from './treeNamingService';
import { HarvestRecord } from '@/types/tree.types';

// Types matching your Flutter code
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other Firebase User properties as needed
}

export type DocumentData = Record<string, any>;

class FirebaseService {
  private authService: FirebaseAuthService;
  private userService: UserService;
  private farmService: FarmService;
  private treeService: TreeService;
  private taskService: TaskService;
  private journalService: JournalService;
  private scanService: ScanService;
  private aiChatService: AIChatService;
  private queryService: QueryService;
  private treeNamingService: TreeNamingService;

  // ADDED: Direct Firestore access for AI scheduler (matching Flutter)
  readonly firestore = db;

  constructor() {
    this.authService = new FirebaseAuthService();
    this.userService = new UserService();
    this.farmService = new FarmService();
    this.treeService = new TreeService();
    this.taskService = new TaskService();
    this.journalService = new JournalService();
    this.scanService = new ScanService();
    this.aiChatService = new AIChatService();
    this.queryService = new QueryService();
    this.treeNamingService = new TreeNamingService();
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================
  async signIn(email: string, password: string): Promise<User | null> {
    return this.authService.signIn(email, password);
  }

  async signUp(email: string, password: string): Promise<User | null> {
    return this.authService.signUp(email, password);
  }

  async signOut(): Promise<void> {
    return this.authService.signOut();
  }

  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  async resetPassword(email: string): Promise<void> {
    return this.authService.resetPassword(email);
  }

  // ==========================================
  // USER MANAGEMENT METHODS
  // ==========================================
  async createUserProfile(options: {
    name: string;
    email: string;
    role: string;
    farmId: string;
    settings?: DocumentData;
  }): Promise<void> {
    return this.userService.createUserProfile(options);
  }

  async upsertUserProfile(options: {
    name: string;
    email: string;
    role: string;
    farmId?: string;
    settings?: DocumentData;
    additionalData?: DocumentData;
  }): Promise<void> {
    return this.userService.upsertUserProfile(options);
  }

  async updateUserProfile(updates: DocumentData): Promise<void> {
    return this.userService.updateUserProfile(updates);
  }

  async updateUserSettings(settings: DocumentData): Promise<void> {
    return this.userService.updateUserSettings(settings);
  }

  async getUserProfile(): Promise<DocumentData | null> {
    return this.userService.getUserProfile();
  }

  getUserProfileStream(callback: (data: DocumentData | null) => void): () => void {
    return this.userService.getUserProfileStream(callback);
  }

  async getCurrentUserFarmId(): Promise<string | null> {
    return this.userService.getCurrentUserFarmId();
  }


  async getFarmCode(farmId: string): Promise<string | null> {
    return this.farmService.getFarmCode(farmId);
  }

  // ==========================================
  // FARM MANAGEMENT METHODS
  // ==========================================
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
    return this.farmService.createOrUpdateFarmProfile(options);
  }

  async getFarmProfile(farmId: string): Promise<DocumentData | null> {
    return this.farmService.getFarmProfile(farmId);
  }

  getFarmProfileStream(farmId: string, callback: (data: DocumentData | null) => void): () => void {
    return this.farmService.getFarmProfileStream(farmId, callback);
  }

  async updateFarmProfile(farmId: string, updates: DocumentData): Promise<void> {
    return this.farmService.updateFarmProfile(farmId, updates);
  }

  async isFarmSetupComplete(farmId: string): Promise<boolean> {
    return this.farmService.isFarmSetupComplete(farmId);
  }

  async getUserFarms(userId: string): Promise<DocumentData[]> {
    return this.farmService.getUserFarms(userId);
  }

  async deleteFarm(farmId: string): Promise<void> {
    return this.farmService.deleteFarm(farmId);
  }

  async getFarmStatisticsWithSetup(farmId: string): Promise<DocumentData> {
    return this.farmService.getFarmStatisticsWithSetup(farmId);
  }

  // Statistics methods
  async getStatistics(farmId: string): Promise<DocumentData> {
    return this.farmService.getStatistics(farmId);
  }

  getStatisticsStream(farmId: string, callback: (data: DocumentData | null) => void): () => void {
    return this.farmService.getStatisticsStream(farmId, callback);
  }

  // Backward compatibility
  async createFarm(options: { name: string; location: string }): Promise<string> {
    return this.farmService.createFarm(options);
  }

  async updateFarm(farmId: string, updates: DocumentData): Promise<void> {
    return this.farmService.updateFarm(farmId, updates);
  }

  async getFarm(farmId: string): Promise<DocumentData | null> {
    return this.farmService.getFarm(farmId);
  }

  // ==========================================
  // TREE MANAGEMENT METHODS (CRITICAL - Must match Flutter exactly)
  // ==========================================
  
  // FIXED: Support both signatures (matching Flutter)
  async addTree(farmId: string, treeData: DocumentData): Promise<string> {
    console.log('🌳 FirebaseService.addTree called - farmId:', farmId, 'treeData:', treeData);
    return this.treeService.addTree({
      farmId,
      treeData
    });
  }

  // Keep old signature for backward compatibility (matching Flutter)
  async addTreeLegacy(options: {
    farmId: string;
    type: string;
    healthStatus?: string;
    growthStage?: string;
    cluster?: string;
    flagged?: boolean;
  }): Promise<string> {
    return this.treeService.addTree(options);
  }

  async updateTree(farmId: string, treeId: string, updates: DocumentData): Promise<void> {
    return this.treeService.updateTree(farmId, treeId, updates);
  }

  async deleteTree(farmId: string, treeId: string): Promise<void> {
    return this.treeService.deleteTree(farmId, treeId);
  }

  async flagTree(farmId: string, treeId: string, flagged: boolean): Promise<void> {
    return this.treeService.flagTree(farmId, treeId, flagged);
  }

  getTrees(farmId: string, callback: (snapshot: any) => void): () => void {
    console.log('🔥 FirebaseService.getTrees called - farmId:', farmId);
    return this.treeService.getTrees(farmId, callback);
  }

  getFlaggedTrees(farmId: string, callback: (snapshot: any) => void): () => void {
    return this.treeService.getFlaggedTrees(farmId, callback);
  }

  // Individual tree methods
  async getTree(farmId: string, treeId: string): Promise<DocumentData | null> {
    return this.treeService.getTree(farmId, treeId);
  }

  async getTreeSafe(farmId: string, treeId: string): Promise<DocumentData | null> {
    return this.treeService.getTreeSafe(farmId, treeId);
  }

  getTreeStream(farmId: string, treeId: string, callback: (data: DocumentData | null) => void): () => void {
    return this.treeService.getTreeStream(farmId, treeId, callback);
  }

  // Cluster methods
  getTreesByCluster(farmId: string, cluster: string, callback: (snapshot: any) => void): () => void {
    return this.treeService.getTreesByCluster(farmId, cluster, callback);
  }

  // FIXED: Return stream
  getClusters(farmId: string, callback: (snapshot: any) => void): () => void {
    return this.treeService.getClusters(farmId, callback);
  }

  // Keep list version for backward compatibility
  async getClustersList(farmId: string): Promise<string[]> {
    return this.treeService.getClustersList(farmId);
  }

  async updateTreeCluster(farmId: string, treeId: string, newCluster: string): Promise<void> {
    return this.treeService.updateTreeCluster(farmId, treeId, newCluster);
  }

  async batchUpdateTreesCluster(farmId: string, treeIds: string[], cluster: string): Promise<void> {
    return this.treeService.batchUpdateTreesCluster(farmId, treeIds, cluster);
  }

  async getClusterStatistics(farmId: string, cluster: string): Promise<DocumentData> {
    return this.treeService.getClusterStatistics(farmId, cluster);
  }

  async migrateExistingTreesToCluster(farmId: string): Promise<void> {
    return this.treeService.migrateExistingTreesToCluster(farmId);
  }

  async treeExists(farmId: string, treeId: string): Promise<boolean> {
    return this.treeService.treeExists(farmId, treeId);
  }

  async addCluster(farmId: string, clusterName: string): Promise<void> {
    return this.treeService.addCluster(farmId, clusterName);
  }

  async deleteClusterFromCollection(farmId: string, clusterName: string): Promise<void> {
    return this.treeService.deleteClusterFromCollection(farmId, clusterName);
  }

  async getClustersFromCollection(farmId: string): Promise<string[]> {
    return this.treeService.getClustersFromCollection(farmId);
  }

  getClustersStream(farmId: string, callback: (clusters: string[]) => void): () => void {
    return this.treeService.getClustersStream(farmId, callback);
  }

  async renameCluster(farmId: string, oldName: string, newName: string): Promise<void> {
    return this.treeService.renameCluster(farmId, oldName, newName);
  }

  // Enhanced tree queries
  async getTreesWithDetails(farmId: string, options?: { limit?: number }): Promise<DocumentData[]> {
    const limit = options?.limit || 5;
    return this.treeService.getTreesWithDetails(farmId, limit);
  }

  async generateTreeData(options: {
    farmId: string;
    variety: string;
    additionalData?: Record<string, any>;
  }) {
    return this.treeNamingService.generateTreeData(options);
  }

  async generateTreeName(options: {
    farmId: string;
    variety: string;
  }) {
    return this.treeNamingService.generateTreeName(options);
  }

  async recomputeAllClusterStats(farmId: string): Promise<void> {
    return this.treeService.recomputeAllClusterStats(farmId);
  }

  async recordHarvest(farmId: string, harvest: Omit<HarvestRecord, 'id' | 'createdAt'>): Promise<string> {
    return this.treeService.recordHarvest(farmId, harvest);
  }
  // ==========================================
  // TASK MANAGEMENT METHODS
  // ==========================================
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
    return this.taskService.addTask(options);
  }

  async updateTask(farmId: string, taskId: string, updates: DocumentData): Promise<void> {
    return this.taskService.updateTask(farmId, taskId, updates);
  }

  async updateTaskStatus(farmId: string, taskId: string, status: string): Promise<void> {
    return this.taskService.updateTaskStatus(farmId, taskId, status);
  }

  async deleteTask(farmId: string, taskId: string): Promise<void> {
    return this.taskService.deleteTask(farmId, taskId);
  }

  getTasks(farmId: string, callback: (snapshot: any) => void): () => void {
    return this.taskService.getTasks(farmId, callback);
  }

  getTasksByStatus(farmId: string, status: string, callback: (snapshot: any) => void): () => void {
    return this.taskService.getTasksByStatus(farmId, status, callback);
  }

  getMyTasks(farmId: string, callback: (snapshot: any) => void): () => void {
    return this.taskService.getMyTasks(farmId, callback);
  }

  getTasksByDate(farmId: string, date: Date, callback: (snapshot: any) => void): () => void {
    return this.taskService.getTasksByDate(farmId, date, callback);
  }

  async getPendingTasksCount(farmId: string): Promise<number> {
    return this.taskService.getPendingTasksCount(farmId);
  }

  async getTodayTasksList(farmId: string): Promise<DocumentData[]> {
    return this.taskService.getTodayTasksList(farmId);
  }

  async batchUpdateTasks(farmId: string, taskIds: string[], updates: DocumentData): Promise<void> {
    return this.taskService.batchUpdateTasks(farmId, taskIds, updates);
  }

  // Get tasks in date range (for AI scheduler)
  async getTasksInDateRange(farmId: string, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<DocumentData[]> {
    return this.taskService.getTasksInDateRange(farmId, options);
  }

  // Get all tasks
  async getAllTasks(farmId: string): Promise<DocumentData[]> {
    return this.taskService.getAllTasks(farmId);
  }

  // ==========================================
  // JOURNAL METHODS
  // ==========================================
  async addJournalEntry(options: {
    farmId: string;
    action: string;
    treeId: string;
    notes?: string;
  }): Promise<string> {
    return this.journalService.addJournalEntry(options);
  }

  async updateJournalEntry(farmId: string, entryId: string, updates: DocumentData): Promise<void> {
    return this.journalService.updateJournalEntry(farmId, entryId, updates);
  }

  async deleteJournalEntry(farmId: string, entryId: string): Promise<void> {
    return this.journalService.deleteJournalEntry(farmId, entryId);
  }

  getJournalEntries(farmId: string, callback: (snapshot: any) => void, options?: { limit?: number }): () => void {
    const limit = options?.limit || 50;
    return this.journalService.getJournalEntries(farmId, callback, limit);
  }

  getJournalEntriesByTree(farmId: string, treeId: string, callback: (snapshot: any) => void): () => void {
    return this.journalService.getJournalEntriesByTree(farmId, treeId, callback);
  }

  // ==========================================
  // SCAN METHODS
  // ==========================================
  async addScan(options: {
    farmId: string;
    imageUrl: string;
    detectedDisease: string;
    confidence: number;
    treeId?: string;
    additionalData?: DocumentData;
  }): Promise<string> {
    return this.scanService.addScan(options);
  }

  async updateScan(farmId: string, scanId: string, updates: DocumentData): Promise<void> {
    return this.scanService.updateScan(farmId, scanId, updates);
  }

  async deleteScan(farmId: string, scanId: string): Promise<void> {
    return this.scanService.deleteScan(farmId, scanId);
  }

  getScans(farmId: string, callback: (snapshot: any) => void, options?: { limit?: number }): () => void {
    const limit = options?.limit || 10;
    return this.scanService.getScans(farmId, callback, limit);
  }

  getScansByTree(farmId: string, treeId: string, callback: (snapshot: any) => void): () => void {
    return this.scanService.getScansByTree(farmId, treeId, callback);
  }

  async getScansByDisease(farmId: string, diseaseName: string): Promise<DocumentData[]> {
    return this.scanService.getScansByDisease(farmId, diseaseName);
  }

  async getRecentScansWithDetails(farmId: string, options?: { limit?: number }): Promise<DocumentData[]> {
    const limit = options?.limit || 5;
    return this.scanService.getRecentScansWithDetails(farmId, limit);
  }

  // ==========================================
  // AI CHAT METHODS
  // ==========================================
  async createChatSession(farmId: string): Promise<string> {
    return this.aiChatService.createChatSession(farmId);
  }

  async addChatMessage(options: {
    chatId: string;
    sender: string;
    text: string;
  }): Promise<string> {
    return this.aiChatService.addChatMessage(options);
  }

  getChatMessages(chatId: string, callback: (snapshot: any) => void): () => void {
    return this.aiChatService.getChatMessages(chatId, callback);
  }

  async getUserChatSessions(): Promise<DocumentData[]> {
    return this.aiChatService.getUserChatSessions();
  }

  async deleteChatSession(chatId: string): Promise<void> {
    return this.aiChatService.deleteChatSession(chatId);
  }

  // ==========================================
  // NOTIFICATION METHODS (NEW)
  // ==========================================
  
  /// Get all notifications for a farm
  async getNotifications(farmId: string): Promise<DocumentData[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'farms', farmId, 'notifications'),
          orderBy('timestamp', 'desc'),
          limit(100)
        )
      );

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
    } catch (e) {
      console.error('Error getting notifications:', e);
      return [];
    }
  }

  /// Get notifications stream
  getNotificationsStream(farmId: string, callback: (snapshot: any) => void): () => void {
    const q = query(
      collection(db, 'farms', farmId, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, callback);
  }

  /// Get unread notifications count
  async getUnreadNotificationsCount(farmId: string): Promise<number> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'farms', farmId, 'notifications'),
          where('read', '==', false)
        )
      );

      return snapshot.docs.length;
    } catch (e) {
      console.error('Error getting unread count:', e);
      return 0;
    }
  }

  /// Mark notification as read
  async markNotificationAsRead(farmId: string, notificationId: string): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'farms', farmId, 'notifications', notificationId),
        { read: true }
      );
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }

  /// Mark all notifications as read
  async markAllNotificationsAsRead(farmId: string): Promise<void> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'farms', farmId, 'notifications'),
          where('read', '==', false)
        )
      );

      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.update(document.ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  }

  /// Delete notification
  async deleteNotification(farmId: string, notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'farms', farmId, 'notifications', notificationId));
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  }

  /// Clear old notifications (older than 30 days)
  async clearOldNotifications(farmId: string): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const snapshot = await getDocs(
        query(
          collection(db, 'farms', farmId, 'notifications'),
          where('timestamp', '<', Timestamp.fromDate(thirtyDaysAgo))
        )
      );

      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
    } catch (e) {
      console.error('Error clearing old notifications:', e);
    }
  }

  // ==========================================
  // ENHANCED QUERY METHODS
  // ==========================================
  getStatisticsLive(farmId: string, callback: (data: DocumentData) => void): () => void {
    return this.queryService.getStatisticsLive(farmId, callback);
  }

  async getDashboardSummary(farmId: string): Promise<DocumentData> {
    return this.queryService.getDashboardSummary(farmId);
  }
}

// Export singleton instance (matching Flutter usage pattern)
export const firebaseService = new FirebaseService();
export default firebaseService;
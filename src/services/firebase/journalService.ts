// src/services/firebase/journal-service.ts
import { 
  db, 
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

export class JournalService {
  
  async addJournalEntry(options: {
    farmId: string;
    action: string;
    treeId: string;
    notes?: string;
  }): Promise<string> {
    const { farmId, action, treeId, notes } = options;
    
    const journalData: Record<string, any> = {
      action,
      treeId,
      timestamp: serverTimestamp(),
      notes: notes || '',
    };

    const journalRef = await addDoc(
      collection(db, 'farms', farmId, 'journal'),
      journalData
    );

    console.log('📝 Journal entry added:', action, 'for tree:', treeId);
    return journalRef.id;
  }

  async updateJournalEntry(farmId: string, entryId: string, updates: Record<string, any>): Promise<void> {
    await updateDoc(
      doc(db, 'farms', farmId, 'journal', entryId),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      }
    );
    
    console.log('📝 Journal entry updated:', entryId);
  }

  async deleteJournalEntry(farmId: string, entryId: string): Promise<void> {
    await deleteDoc(doc(db, 'farms', farmId, 'journal', entryId));
    console.log('🗑️ Journal entry deleted:', entryId);
  }

  getJournalEntries(farmId: string, callback: (snapshot: QuerySnapshot) => void, limitCount: number = 50): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'journal'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, callback);
  }

  getJournalEntriesByTree(farmId: string, treeId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'farms', farmId, 'journal'),
      where('treeId', '==', treeId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, callback);
  }

  // Enhanced journal methods
  async getJournalEntryWithDetails(farmId: string, entryId: string): Promise<Record<string, any> | null> {
    try {
      const entryDoc = await getDoc(doc(db, 'farms', farmId, 'journal', entryId));
      
      if (!entryDoc.exists()) {
        return null;
      }

      const entryData = entryDoc.data();
      const treeId = entryData.treeId;
      
      let treeDetails: Record<string, any> = {};
      if (treeId) {
        try {
          const treeDoc = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
          if (treeDoc.exists()) {
            treeDetails = treeDoc.data() || {};
          }
        } catch (error) {
          console.error('Error fetching tree details:', error);
        }
      }

      return {
        id: entryDoc.id,
        ...entryData,
        treeDetails,
      };
    } catch (error) {
      console.error('Error getting journal entry with details:', error);
      return null;
    }
  }

  async getRecentJournalEntries(farmId: string, limitCount: number = 10): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'journal'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const entries: Record<string, any>[] = [];

      // Fetch tree details for each entry
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const treeId = data.treeId;
        
        let treeName = 'Unknown Tree';
        let treeType = 'Unknown';
        
        if (treeId) {
          try {
            const treeDoc = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
            if (treeDoc.exists()) {
              const treeData = treeDoc.data();
              treeName = treeData?.tree_name || treeData?.name || `Tree ${treeId}`;
              treeType = treeData?.type || 'Unknown';
            }
          } catch (error) {
            console.error('Error fetching tree details:', error);
          }
        }

        entries.push({
          id: docSnap.id,
          ...data,
          treeName,
          treeType,
        });
      }

      return entries;
    } catch (error) {
      console.error('Error getting recent journal entries:', error);
      return [];
    }
  }

  async getJournalStats(farmId: string): Promise<Record<string, any>> {
    try {
      // Get all journal entries
      const q = query(collection(db, 'farms', farmId, 'journal'));
      const snapshot = await getDocs(q);
      
      let totalEntries = 0;
      let entriesByAction: Record<string, number> = {};
      let entriesByTree: Record<string, number> = {};
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      let recentEntries = 0;

      snapshot.docs.forEach(docSnap => {
        totalEntries++;
        
        const data = docSnap.data();
        const action = data.action || 'unknown';
        const treeId = data.treeId || 'unknown';
        const timestamp = data.timestamp?.toDate?.() || new Date(0);

        // Count by action
        entriesByAction[action] = (entriesByAction[action] || 0) + 1;
        
        // Count by tree
        entriesByTree[treeId] = (entriesByTree[treeId] || 0) + 1;
        
        // Count recent entries (last 7 days)
        if (timestamp > lastWeek) {
          recentEntries++;
        }
      });

      // Get most common action
      let mostCommonAction = 'None';
      let maxCount = 0;
      Object.entries(entriesByAction).forEach(([action, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonAction = action;
        }
      });

      // Get most active tree
      let mostActiveTree = 'None';
      let maxTreeCount = 0;
      Object.entries(entriesByTree).forEach(([treeId, count]) => {
        if (count > maxTreeCount && treeId !== 'unknown') {
          maxTreeCount = count;
          mostActiveTree = treeId;
        }
      });

      return {
        totalEntries,
        recentEntries,
        mostCommonAction,
        mostCommonActionCount: maxCount,
        mostActiveTree,
        mostActiveTreeCount: maxTreeCount,
        entriesByAction,
        entriesByTree,
      };
    } catch (error) {
      console.error('Error getting journal stats:', error);
      return {
        totalEntries: 0,
        recentEntries: 0,
        mostCommonAction: 'None',
        mostCommonActionCount: 0,
        mostActiveTree: 'None',
        mostActiveTreeCount: 0,
        entriesByAction: {},
        entriesByTree: {},
      };
    }
  }

  async batchAddJournalEntries(farmId: string, entries: Array<{
    action: string;
    treeId: string;
    notes?: string;
  }>): Promise<string[]> {
    try {
      const entryIds: string[] = [];
      
      for (const entry of entries) {
        const entryId = await this.addJournalEntry({
          farmId,
          action: entry.action,
          treeId: entry.treeId,
          notes: entry.notes,
        });
        entryIds.push(entryId);
      }
      
      console.log(`✅ Added ${entryIds.length} journal entries in batch`);
      return entryIds;
    } catch (error) {
      console.error('Error batch adding journal entries:', error);
      throw error;
    }
  }

  async searchJournalEntries(farmId: string, searchTerm: string): Promise<Record<string, any>[]> {
    try {
      // Get all entries and filter locally (Firestore doesn't support text search easily)
      const q = query(
        collection(db, 'farms', farmId, 'journal'),
        orderBy('timestamp', 'desc'),
        limit(100) // Limit for performance
      );
      
      const snapshot = await getDocs(q);
      const filteredEntries: Record<string, any>[] = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const searchableText = [
          data.action || '',
          data.notes || '',
          data.treeId || '',
        ].join(' ').toLowerCase();
        
        if (searchableText.includes(searchTerm.toLowerCase())) {
          filteredEntries.push({
            id: docSnap.id,
            ...data,
          });
        }
      });

      return filteredEntries;
    } catch (error) {
      console.error('Error searching journal entries:', error);
      return [];
    }
  }

  async getEntriesByDateRange(farmId: string, startDate: Date, endDate: Date): Promise<Record<string, any>[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'journal'),
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
      console.error('Error getting entries by date range:', error);
      return [];
    }
  }

  // Get stream of journal statistics
  getJournalStatsStream(farmId: string, callback: (stats: Record<string, any>) => void): Unsubscribe {
    return this.getJournalEntries(farmId, async (snapshot) => {
      const stats = await this.getJournalStats(farmId);
      callback(stats);
    }, 1000); // Limit to 1000 entries for performance
  }
}

// Export singleton instance
export const journalService = new JournalService();
// src/services/firebase/tree-naming-service.ts
import { 
  db, 
  serverTimestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  setDoc // Add this import
} from './firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for generating unique tree IDs and human-readable tree names
 * 
 * Tree Naming Convention (MUST MATCH FLUTTER):
 * - tree_id: UUID for QR codes and internal reference (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
 * - tree_name: Human-readable sequential name (e.g., "Tree_carabao_0001", "Tree_pico_0023")
 * 
 * Each variety maintains its own sequential counter in Firestore
 */
export class TreeNamingService {
  
  /**
   * Generates a unique UUID for tree_id (used for QR codes)
   * ⚠️ MUST USE SAME UUID LIBRARY AS FLUTTER!
   */
  generateUniqueId(): string {
    return uuidv4();
  }

  /**
   * Generates a sequential tree name based on variety
   * Example: Tree_carabao_0001, Tree_carabao_0002, Tree_pico_0001
   * 
   * Uses Firestore transaction to ensure no duplicate numbers
   * ⚠️ MUST BE EXACT SAME FORMAT AS FLUTTER!
   */
  async generateTreeName(options: {
    farmId: string;
    variety: string;
  }): Promise<string> {
    const { farmId, variety } = options;
    
    try {
      const normalizedVariety = this._normalizeVariety(variety);
      const counterDocRef = doc(
        db, 
        'farms', 
        farmId, 
        'tree_counters', 
        normalizedVariety
      );

      // Use transaction to safely increment counter (MATCHING FLUTTER)
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        
        let nextNumber: number;
        if (!counterDoc.exists()) {
          // First tree of this variety
          nextNumber = 1;
          transaction.set(counterDocRef, {
            variety: normalizedVariety,
            current_count: 1,
            last_updated: serverTimestamp(),
          });
        } else {
          // Increment existing counter
          const currentCount = counterDoc.data()?.current_count || 0;
          nextNumber = currentCount + 1;
          transaction.update(counterDocRef, {
            current_count: nextNumber,
            last_updated: serverTimestamp(),
          });
        }

        // ⚠️ CRITICAL: Check which format your Flutter actually uses!
        // Flutter code shows: 'Mango_${normalizedVariety}_${_formatNumber(nextNumber)}'
        // But comments say: "Tree_carabao_0001"
        const treeName = `Tree_${normalizedVariety}_${this._formatNumber(nextNumber)}`;
        console.log('✅ Generated tree name:', treeName);
        return treeName;
      });
    } catch (error) {
      console.error('❌ Error generating tree name:', error);
      // Fallback to timestamp-based name (same as Flutter)
      return `Tree_${this._normalizeVariety(variety)}_${Date.now()}`;
    }
  }

  /**
   * Formats number with leading zeros (e.g., 1 -> 0001, 23 -> 0023)
   * ⚠️ MUST BE EXACT SAME FORMAT AS FLUTTER!
   */
  private _formatNumber(number: number): string {
    return number.toString().padStart(4, '0');
  }

  /**
   * Normalizes variety name for consistent naming
   * - Converts to lowercase
   * - Removes special characters
   * - Replaces spaces with underscores
   * ⚠️ MUST BE EXACT SAME LOGIC AS FLUTTER!
   */
  private _normalizeVariety(variety: string): string {
    return variety
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_'); // Replace spaces with underscore
  }

  /**
   * Gets the current count for a variety (useful for displaying stats)
   */
  async getCurrentCount(farmId: string, variety: string): Promise<number> {
    try {
      const normalizedVariety = this._normalizeVariety(variety);
      const counterDoc = await getDoc(
        doc(db, 'farms', farmId, 'tree_counters', normalizedVariety)
      );

      if (counterDoc.exists()) {
        return counterDoc.data()?.current_count || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting current count:', error);
      return 0;
    }
  }

  /**
   * Gets all variety counters for a farm
   */
  async getAllVarietyCounts(farmId: string): Promise<Record<string, number>> {
    try {
      const snapshot = await getDocs(
        collection(db, 'farms', farmId, 'tree_counters')
      );

      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        counts[doc.id] = doc.data().current_count || 0;
      });
      return counts;
    } catch (error) {
      console.error('Error getting variety counts:', error);
      return {};
    }
  }

  /**
   * Validates if a tree name follows the correct format
   * ⚠️ MUST BE EXACT SAME VALIDATION AS FLUTTER!
   */
  isValidTreeName(treeName: string): boolean {
    // ⚠️ IMPORTANT: Check your Flutter regex pattern!
    // Flutter uses: r'^Tree_[a-z0-9_]+_\d{4}$'
    const pattern = /^Tree_[a-z0-9_]+_\d{4}$/;
    return pattern.test(treeName);
  }

  /**
   * Extracts variety from tree name
   * Example: "Tree_carabao_0001" -> "carabao"
   * ⚠️ MUST BE EXACT SAME LOGIC AS FLUTTER!
   */
  extractVarietyFromTreeName(treeName: string): string | null {
    if (!this.isValidTreeName(treeName)) return null;
    
    const parts = treeName.split('_');
    if (parts.length >= 3) {
      // Remove "Tree" prefix and number suffix, join remaining parts
      return parts.slice(1, -1).join('_');
    }
    return null;
  }

  /**
   * Extracts number from tree name
   * Example: "Tree_carabao_0001" -> 1
   * ⚠️ MUST BE EXACT SAME LOGIC AS FLUTTER!
   */
  extractNumberFromTreeName(treeName: string): number | null {
    if (!this.isValidTreeName(treeName)) return null;
    
    const parts = treeName.split('_');
    if (parts.length > 0) {
      return parseInt(parts[parts.length - 1], 10);
    }
    return null;
  }

  /**
   * Resets counter for a variety (use with caution!)
   * ⚠️ MUST BE EXACT SAME OPERATION AS FLUTTER!
   */
  async resetVarietyCounter(farmId: string, variety: string, options?: { startFrom?: number }): Promise<void> {
    const startFrom = options?.startFrom || 0;
    
    try {
      const normalizedVariety = this._normalizeVariety(variety);
      
      await setDoc(
        doc(db, 'farms', farmId, 'tree_counters', normalizedVariety),
        {
          variety: normalizedVariety,
          current_count: startFrom,
          last_updated: serverTimestamp(),
          reset_at: serverTimestamp(),
        }
      );
      
      console.log('✅ Reset counter for', normalizedVariety, 'to', startFrom);
    } catch (error) {
      console.error('❌ Error resetting counter:', error);
      throw error;
    }
  }

  /**
   * Gets tree name suggestions based on partial input
   */
  async searchTreeNames(farmId: string, queryStr: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'farms', farmId, 'trees'),
        where('tree_name', '>=', queryStr),
        where('tree_name', '<=', queryStr + '\uf8ff'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      
      const treeNames: string[] = [];
      snapshot.docs.forEach(doc => {
        const treeName = doc.data().tree_name;
        if (treeName && typeof treeName === 'string') {
          treeNames.push(treeName);
        }
      });
      
      return treeNames;
    } catch (error) {
      console.error('Error searching tree names:', error);
      return [];
    }
  }

  /**
   * Batch generates tree names for multiple trees (more efficient for setup)
   * ⚠️ MUST BE EXACT SAME LOGIC AS FLUTTER!
   */
  async batchGenerateTreeNames(options: {
    farmId: string;
    variety: string;
    count: number;
  }): Promise<string[]> {
    const { farmId, variety, count } = options;
    
    try {
      const normalizedVariety = this._normalizeVariety(variety);
      const counterDocRef = doc(
        db, 
        'farms', 
        farmId, 
        'tree_counters', 
        normalizedVariety
      );

      // Use transaction to safely increment counter (MATCHING FLUTTER)
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        
        let startNumber: number;
        if (!counterDoc.exists()) {
          startNumber = 1;
          transaction.set(counterDocRef, {
            variety: normalizedVariety,
            current_count: count,
            last_updated: serverTimestamp(),
          });
        } else {
          const currentCount = counterDoc.data()?.current_count || 0;
          startNumber = currentCount + 1;
          transaction.update(counterDocRef, {
            current_count: currentCount + count,
            last_updated: serverTimestamp(),
          });
        }

        // Generate all names
        const names: string[] = [];
        for (let i = 0; i < count; i++) {
          const number = startNumber + i;
          names.push(`Tree_${normalizedVariety}_${this._formatNumber(number)}`);
        }

        console.log(`✅ Batch generated ${names.length} tree names for ${normalizedVariety}`);
        return names;
      });
    } catch (error) {
      console.error('❌ Error batch generating tree names:', error);
      throw error;
    }
  }

  /**
   * Gets next available number for a variety (without incrementing counter)
   */
  async getNextAvailableNumber(farmId: string, variety: string): Promise<number> {
    const currentCount = await this.getCurrentCount(farmId, variety);
    return currentCount + 1;
  }

  /**
   * Parses a tree name into its components
   * Example: "Tree_carabao_0001" -> { prefix: "Tree", variety: "carabao", number: 1 }
   */
  parseTreeName(treeName: string): { prefix: string; variety: string; number: number } | null {
    if (!this.isValidTreeName(treeName)) return null;
    
    const parts = treeName.split('_');
    const number = this.extractNumberFromTreeName(treeName);
    const variety = this.extractVarietyFromTreeName(treeName);
    
    if (number !== null && variety !== null) {
      return {
        prefix: parts[0] || 'Tree',
        variety,
        number
      };
    }
    
    return null;
  }

  /**
   * Generates a complete tree data object with both ID and name
   * This is the MAIN method you'll use when adding trees
   */
  async generateTreeData(options: {
    farmId: string;
    variety: string;
    additionalData?: Record<string, any>;
  }): Promise<{
    tree_id: string;
    tree_name: string;
    variety: string;
    created_at?: any;
    [key: string]: any;
  }> {
    const { farmId, variety, additionalData } = options;
    
    const tree_id = this.generateUniqueId();
    const tree_name = await this.generateTreeName({ farmId, variety });
    const normalizedVariety = this._normalizeVariety(variety);
    
    const baseData = {
      tree_id,
      tree_name,
      variety: normalizedVariety,
      created_at: serverTimestamp(),
    };

    return {
      ...baseData,
      ...additionalData,
    };
  }

  /**
   * Validates if a variety name is valid for tree naming
   */
  isValidVarietyName(variety: string): boolean {
    const normalized = this._normalizeVariety(variety);
    // Check if variety contains only letters, numbers, underscores
    return /^[a-z0-9_]+$/.test(normalized) && normalized.length > 0;
  }

  /**
   * Gets list of all varieties that have counters in a farm
   */
  async getExistingVarieties(farmId: string): Promise<string[]> {
    try {
      const counts = await this.getAllVarietyCounts(farmId);
      return Object.keys(counts).sort();
    } catch (error) {
      console.error('Error getting existing varieties:', error);
      return [];
    }
  }

  /**
   * Gets total number of trees across all varieties in a farm
   */
  async getTotalTreeCount(farmId: string): Promise<number> {
    try {
      const counts = await this.getAllVarietyCounts(farmId);
      return Object.values(counts).reduce((sum, count) => sum + count, 0);
    } catch (error) {
      console.error('Error getting total tree count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const treeNamingService = new TreeNamingService();
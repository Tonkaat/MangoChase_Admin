// src/types/tree.types.ts

export type HealthStatus = 'Healthy' | 'Warning' | 'Critical' | 'Unknown' | 'healthy' | 'warning' | 'critical' | 'unknown';
export type GrowthStage = 'seedling' | 'juvenile' | 'mature' | 'flowering' | 'fruiting' | 'Seedling' | 'Juvenile' | 'Mature' | 'Flowering' | 'Fruiting';

export interface Tree {
  // ⚠️ MUST MATCH FLUTTER DATABASE FIELDS
  id: string;                    // Firestore document ID
  tree_id: string;               // UUID for QR codes (from TreeNamingService)
  tree_name: string;             // Human-readable name (e.g., "Tree_carabao_0001")
  farmId: string;                // Parent farm ID
  
  // Tree properties
  type: string;                  // e.g., "Mango", "Avocado"
  variety: string;               // e.g., "Carabao", "Pico", "Indian" (normalized)
  healthStatus: HealthStatus;    // Health status (case-sensitive: "Healthy", "Warning", etc.)
  growthStage: GrowthStage;      // Growth stage
  cluster: string;               // Cluster name (e.g., "North Field", "Default")
  flagged: boolean;              // Flagged for attention
  
  // Additional details
  notes?: string;
  location?: string;             // GPS coordinates or location description
  plantedDate?: Date;            // When the tree was planted
  lastInspection?: Date;         // Last inspection date (matching Flutter's 'lastInspection')
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields from Firestore
  lastInspectionDate?: Date;     // Alias for lastInspection (for compatibility)
}

export interface Cluster {
  id: string;                    // Firestore document ID (same as name)
  farmId: string;                // Parent farm ID
  name: string;                  // Cluster name (e.g., "North Field")
  description?: string;
  location?: string;
  
  // Statistics (can be calculated)
  treeCount: number;             // Total trees in this cluster
  healthyCount?: number;         // Healthy trees count
  warningCount?: number;         // Warning trees count
  criticalCount?: number;        // Critical trees count
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TreeFilter {
  search: string;
  healthStatus: HealthStatus | 'all';
  growthStage: GrowthStage | 'all';
  cluster: string | 'all';
  flagged: 'all' | 'flagged' | 'unflagged';
}

export interface TreeStats {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  flagged: number;
  clusters: number;
}

// Helper function to auto-calculate growth stage based on tree age
export function autoCalculateGrowthStage(tree: Partial<Tree>): GrowthStage {
  // If tree already has growthStage, use it
  if (tree.growthStage) {
    return tree.growthStage;
  }
  
  // Calculate based on planted date
  if (!tree.plantedDate) {
    return 'seedling';
  }

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(tree.plantedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Example thresholds (adjust based on your tree types)
  if (ageInDays < 90) return 'seedling';
  if (ageInDays < 365) return 'juvenile';
  if (ageInDays < 730) return 'mature';
  if (ageInDays < 1095) return 'flowering';
  return 'fruiting';
}

// Helper function to convert Firestore data to Tree type
export function convertFirestoreTree(data: any): Tree {
  const plantedDate = data.plantedDate?.toDate?.() || data.plantedDate;
  const lastInspection = data.lastInspection?.toDate?.() || data.lastInspectionDate?.toDate?.() || new Date();
  const createdAt = data.createdAt?.toDate?.() || new Date();
  const updatedAt = data.updatedAt?.toDate?.() || createdAt;
  
  return {
    id: data.id || '',
    tree_id: data.tree_id || data.id || '',
    tree_name: data.tree_name || `Tree_${data.id?.slice(0, 8) || 'unknown'}`,
    farmId: data.farmId || '',
    
    type: data.type || 'Unknown',
    variety: data.variety || 'Unknown',
    healthStatus: (data.healthStatus || 'Unknown') as HealthStatus,
    growthStage: autoCalculateGrowthStage({
      growthStage: data.growthStage as GrowthStage,
      plantedDate
    }),
    cluster: data.cluster || 'Default',
    flagged: data.flagged || false,
    
    notes: data.notes,
    location: data.location,
    plantedDate,
    lastInspection,
    
    createdAt,
    updatedAt,
    lastInspectionDate: lastInspection,
  };
}

// Helper function to convert Firestore data to Cluster type
export function convertFirestoreCluster(data: any, treeCount: number = 0): Cluster {
  const createdAt = data.createdAt?.toDate?.() || new Date();
  const updatedAt = data.updatedAt?.toDate?.() || createdAt;
  
  return {
    id: data.id || data.name || '',
    farmId: data.farmId || '',
    name: data.name || data.id || '',
    description: data.description,
    location: data.location,
    
    treeCount,
    healthyCount: data.healthyCount,
    warningCount: data.warningCount,
    criticalCount: data.criticalCount,
    
    createdAt,
    updatedAt,
  };
}

// Type for tree data when adding/updating (matches Flutter TreeService.addTree())
export interface TreeData {
  tree_id?: string;
  tree_name?: string;
  type?: string;
  variety?: string;
  healthStatus?: HealthStatus;
  growthStage?: GrowthStage;
  cluster?: string;
  flagged?: boolean;
  notes?: string;
  location?: string;
  plantedDate?: Date | any;
  lastInspection?: Date | any;
  [key: string]: any;
}

// Type for cluster data when adding/updating (matches Flutter TreeService.addCluster())
export interface ClusterData {
  name: string;
  description?: string;
  location?: string;
  [key: string]: any;
}

// Utility function to normalize health status (Flutter uses capitalized)
export function normalizeHealthStatus(status: string): HealthStatus {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'healthy': return 'Healthy';
    case 'warning': return 'Warning';
    case 'critical': return 'Critical';
    case 'unknown': return 'Unknown';
    default: return 'Unknown';
  }
}

// Utility function to normalize growth stage
export function normalizeGrowthStage(stage: string): GrowthStage {
  const normalized = stage.toLowerCase();
  switch (normalized) {
    case 'seedling': return 'seedling';
    case 'juvenile': return 'juvenile';
    case 'mature': return 'mature';
    case 'flowering': return 'flowering';
    case 'fruiting': return 'fruiting';
    default: return 'seedling';
  }
}
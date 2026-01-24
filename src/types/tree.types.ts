// src/types/tree.types.ts
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type GrowthStage = 'seedling' | 'juvenile' | 'mature' | 'flowering' | 'fruiting';

export interface TreeLocation {
  latitude?: number;
  longitude?: number;
}

export interface Tree {
  id: string;
  farmId: string;
  type: string;
  variety?: string;
  healthStatus: HealthStatus;
  growthStage: GrowthStage;
  cluster?: string;
  flagged: boolean;
  notes?: string;
  location?: TreeLocation;
  plantedDate?: Date;
  lastInspectionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cluster {
  id: string;
  name: string;
  farmId: string;
  description?: string;
  treeCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
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

// Utility functions
export function calculateTreeAge(plantedDate?: Date): number | null {
  if (!plantedDate) return null;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - plantedDate.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return diffYears;
}

export function getGrowthStageFromAge(age: number | null): GrowthStage {
  if (age === null) return 'seedling';
  
  // Adjust these age ranges based on your mango tree growth patterns
  if (age < 1) return 'seedling';
  if (age < 3) return 'juvenile';
  if (age < 5) return 'mature';
  if (age >= 5) {
    // Trees 5+ years can flower and fruit
    // You might want to determine this based on season or other factors
    return 'fruiting';
  }
  
  return 'mature';
}

export function autoCalculateGrowthStage(tree: Tree): GrowthStage {
  const age = calculateTreeAge(tree.plantedDate);
  return getGrowthStageFromAge(age);
}
// src/types/tree.types.ts

export type HealthStatus = 'Healthy' | 'Infected' | 'Unknown' | 'healthy' | 'infected' | 'unknown';
export type GrowthStage = 'seedling' | 'juvenile' | 'mature' | 'flowering' | 'fruiting' | 'Seedling' | 'Juvenile' | 'Mature' | 'Flowering' | 'Fruiting';

export interface Tree {
  // ⚠️ MUST MATCH FLUTTER DATABASE FIELDS
  id: string;
  tree_id: string;
  tree_name: string;
  farmId: string;

  // Tree properties
  type: string;
  variety: string;
  healthStatus: HealthStatus;
  growthStage: GrowthStage;
  cluster: string;
  flagged: boolean;

  // Additional details
  notes?: string;
  location?: string;
  plantedDate?: Date;
  lastInspection?: Date;

  // ── NEW: Agronomic fields for yield prediction ──
  age?: number;            // years (computed from plantedDate or set manually)
  height?: number;         // meters
  canopySpread?: number;   // meters
  lastYield?: number;      // kg from most recent harvest
  missedSprayings?: number; // count in last 90 days (synced from task system)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastInspectionDate?: Date;
}

// ── NEW: Cluster document shape (now includes pre-aggregated stats) ──
export interface ClusterStats {
  treeCount: number;
  healthyCount: number;
  warningCount: number;
  infectedCount: number;
  avgAge: number;
  avgHeight: number;
  avgCanopySpread: number;
  avgLastYield: number;        // kg/tree average across cluster
  totalMissedSprayings: number;
  varieties: string[];         // distinct varieties in this cluster
  lastUpdated: Date;
}

export interface Cluster {
  id: string;
  farmId: string;
  name: string;
  description?: string;
  location?: string;
  assignedFarmerId?: string;
  assignedFarmerName?: string;

  // Statistics (pre-aggregated in Firestore, computed client-side as fallback)
  treeCount: number;
  healthyCount?: number;
  warningCount?: number;
  infectedCount?: number;

  // ── NEW: Yield prediction fields ──
  avgAge?: number;
  avgHeight?: number;
  avgCanopySpread?: number;
  avgLastYield?: number;
  totalMissedSprayings?: number;
  varieties?: string[];
  lastUpdated?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// ── NEW: Harvest record ──
export interface HarvestRecord {
  id?: string;
  farmId: string;
  clusterId: string;
  clusterName: string;
  harvestDate: Date;
  totalKg: number;
  kgPerTree: number;
  treeCount: number;
  variety?: string;
  notes?: string;
  recordedBy?: string;
  createdAt?: Date;
}

export interface TreeFilter {
  search: string;
  healthStatus: HealthStatus | 'all';
  growthStage: GrowthStage | 'all';
  cluster: string | 'all';
}

export interface TreeStats {
  total: number;
  healthy: number;
  infected: number;
  clusters: number;
}

export function autoCalculateGrowthStage(tree: Partial<Tree>): GrowthStage {
  if (tree.growthStage) return tree.growthStage;
  if (!tree.plantedDate) return 'seedling';

  const ageInDays = Math.floor(
    (new Date().getTime() - new Date(tree.plantedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (ageInDays < 90) return 'seedling';
  if (ageInDays < 365) return 'juvenile';
  if (ageInDays < 730) return 'mature';
  if (ageInDays < 1095) return 'flowering';
  return 'fruiting';
}

/** Compute age in years from a planted date */
export function computeAgeFromPlantedDate(plantedDate?: Date | null): number | undefined {
  if (!plantedDate) return undefined;
  const ms = Date.now() - new Date(plantedDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 365)));
}

export function convertFirestoreTree(data: any): Tree {
  const plantedDate = data.plantedDate?.toDate?.() ?? data.plantedDate;
  const lastInspection =
    data.lastInspection?.toDate?.() ??
    data.lastInspectionDate?.toDate?.() ??
    new Date();
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;

  // Compute age from plantedDate if not stored
  const computedAge =
    data.age ??
    (plantedDate
      ? Math.max(0, Math.floor((Date.now() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24 * 365)))
      : undefined);

  return {
    id: data.id || '',
    tree_id: data.tree_id || data.id || '',
    tree_name: data.tree_name || `Tree_${data.id?.slice(0, 8) || 'unknown'}`,
    farmId: data.farmId || '',

    type: data.type || 'Unknown',
    variety: data.variety || 'Unknown',
    healthStatus: (data.healthStatus || 'Unknown') as HealthStatus,
    growthStage: autoCalculateGrowthStage({ growthStage: data.growthStage as GrowthStage, plantedDate }),
    cluster: data.cluster || 'Default',
    flagged: data.flagged || false,

    notes: data.notes,
    location: data.location,
    plantedDate,
    lastInspection,

    // ── Agronomic fields ──
    age: computedAge,
    height: data.height ?? data.heightMeters ?? undefined,
    canopySpread: data.canopySpread ?? data.canopy ?? undefined,
    lastYield: data.lastYield ?? data.previousYield ?? undefined,
    missedSprayings: data.missedSprayings ?? 0,

    createdAt,
    updatedAt,
    lastInspectionDate: lastInspection,
  };
}

export function convertFirestoreCluster(data: any, treeCount: number = 0): Cluster {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;
  const lastUpdated = data.lastUpdated?.toDate?.() ?? undefined;

  return {
    id: data.id || data.name || '',
    farmId: data.farmId || '',
    name: data.name || data.id || '',
    description: data.description,
    location: data.location,
    assignedFarmerId: data.assignedFarmerId,
    assignedFarmerName: data.assignedFarmerName,

    treeCount: data.treeCount ?? treeCount,
    healthyCount: data.healthyCount,
    warningCount: data.warningCount,
    infectedCount: data.infectedCount,

    // ── Yield prediction fields ──
    avgAge: data.avgAge,
    avgHeight: data.avgHeight,
    avgCanopySpread: data.avgCanopySpread,
    avgLastYield: data.avgLastYield,
    totalMissedSprayings: data.totalMissedSprayings,
    varieties: data.varieties ?? [],
    lastUpdated,

    createdAt,
    updatedAt,
  };
}

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

  // ── NEW: agronomic ──
  age?: number;
  height?: number;
  canopySpread?: number;
  lastYield?: number;
  missedSprayings?: number;

  [key: string]: any;
}

export interface ClusterData {
  name: string;
  description?: string;
  location?: string;
  [key: string]: any;
}

export function normalizeHealthStatus(status: string): HealthStatus {
  switch (status.toLowerCase()) {
    case 'healthy': return 'Healthy';
    case 'infected': return 'Infected';
    default: return 'Unknown';
  }
}

export function normalizeGrowthStage(stage: string): GrowthStage {
  switch (stage.toLowerCase()) {
    case 'seedling': return 'seedling';
    case 'juvenile': return 'juvenile';
    case 'mature': return 'mature';
    case 'flowering': return 'flowering';
    case 'fruiting': return 'fruiting';
    default: return 'seedling';
  }
}
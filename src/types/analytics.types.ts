// src/types/analytics.types.ts

export interface OverallStats {
  totalFarms: number;
  totalTrees: number;
  totalYield: number;
  averageHealth: number;
  activeFarmers: number;
  pendingTasks: number;
}

export interface YieldTrend {
  period: string;
  yield?: number;           // actual yield (historical months)
  forecast?: number;        // AI-predicted yield (future months)
  forecastUpper?: number;   // confidence band upper bound
  forecastLower?: number;   // confidence band lower bound
  previousYear?: number;    // same month prior year
}

export interface ClusterPerformance {
  clusterId: string;
  clusterName: string;
  farmId: string;
  farmName: string;
  treeCount: number;
  healthyPercentage: number;
  yieldPerTree: number;
  totalYield: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface HealthDistribution {
  status: 'healthy' | 'warning' | 'critical';
  count: number;
  percentage: number;
}

export interface DiseaseFrequency {
  diseaseName: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalyticsFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  clusterId?: string;
  farmId?: string;
}
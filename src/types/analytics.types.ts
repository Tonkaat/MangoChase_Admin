// Analytics & Reporting Types

export interface FarmYieldData {
  farmId: string;
  farmName: string;
  month: string;
  yield: number;
  target: number;
  variance: number;
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

export interface FarmComparison {
  farmId: string;
  farmName: string;
  location: string;
  totalTrees: number;
  healthyTrees: number;
  totalYield: number;
  yieldPerTree: number;
  efficiencyScore: number;
  rank: number;
}

export interface YieldTrend {
  period: string;
  yield: number;
  forecast?: number;
  previousYear?: number;
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

export interface AnalyticsDateRange {
  startDate: Date;
  endDate: Date;
  preset?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface AnalyticsFilters {
  farmIds: string[];
  clusterIds: string[];
  dateRange: AnalyticsDateRange;
  varieties: string[];
}

export interface OverallStats {
  totalFarms: number;
  totalTrees: number;
  totalYield: number;
  averageHealth: number;
  activeFarmers: number;
  pendingTasks: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  includeCharts: boolean;
  dateRange: AnalyticsDateRange;
  sections: ('overview' | 'yield' | 'clusters' | 'comparison')[];
}

// src/types/analytics.types.ts
//
// ── CHANGED ──────────────────────────────────────────────────────────────────
// YieldTrend: removed `forecast`, `forecastUpper`, `forecastLower`, and
// `previousYear`. These existed to support a linear-regression time-series
// FORECAST (projecting 3 months ahead with confidence bands) and a
// synthetic "previous year" baseline generated with Math.random() noise.
// Per the capstone's "estimation, not forecasting" requirement, the trend
// chart now only shows past months, each computed by re-running the
// rule-based engine against that month's actual health data — no
// projection into the future, no fabricated comparison baseline.
//
// ClusterPerformance: added `healthyCount` (raw headcount, not just a
// percentage) and `avgAge` (average tree age in years). Both are required
// by yieldEstimation.engine.ts's YieldEstimationInput and were missing
// before — `healthyPercentage` alone isn't enough to drive the engine, and
// there was no age field on this type at all.
// ───────────────────────────────────────────────────────────────────────────

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
  yield?: number; // estimated yield for that past month (rule-based, not forecasted)
}

export interface ClusterPerformance {
  clusterId: string;
  clusterName: string;
  farmId: string;
  farmName: string;
  treeCount: number;
  healthyCount: number;        // ← ADDED: raw count of trees classified 'Healthy'
  healthyPercentage: number;
  avgAge: number;               // ← ADDED: average tree age in years for this cluster
  yieldPerTree: number;
  totalYield: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface HealthDistribution {
  status: 'healthy' | 'infected' | 'unknown';
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
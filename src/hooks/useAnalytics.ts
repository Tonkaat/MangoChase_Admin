import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  OverallStats,
  YieldTrend,
  ClusterPerformance,
  HealthDistribution,
  DiseaseFrequency,
  AnalyticsFilters,
} from '@/types/analytics.types';

// ─── Simple linear regression ──────────────────────────────────────────────────
function linearRegression(y: number[]): { slope: number; intercept: number; r2: number } {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, r2: 0 };
  const x = y.map((_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const ssXY = x.reduce((acc, xi, i) => acc + (xi - xMean) * (y[i] - yMean), 0);
  const ssXX = x.reduce((acc, xi) => acc + (xi - xMean) ** 2, 0);
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;
  const yPred = x.map((xi) => slope * xi + intercept);
  const ssTot = y.reduce((acc, yi) => acc + (yi - yMean) ** 2, 0);
  const ssRes = y.reduce((acc, yi, i) => acc + (yi - yPred[i]) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

// ─── Yield estimation from health + scan data ─────────────────────────────────
function estimateYieldFromHealth(
  healthPct: number,
  treeCount: number,
  baseYieldPerTree = 22,
): number {
  // Disease burden penalty: lower health → lower yield
  const healthFactor = 0.4 + 0.6 * (healthPct / 100);
  return Math.round(treeCount * baseYieldPerTree * healthFactor);
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useAnalytics(farmId?: string, filters?: AnalyticsFilters) {
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalFarms: 0,
    totalTrees: 0,
    totalYield: 0,
    averageHealth: 0,
    activeFarmers: 0,
    pendingTasks: 0,
  });
  const [yieldTrends, setYieldTrends] = useState<YieldTrend[]>([]);
  const [clusterPerformance, setClusterPerformance] = useState<ClusterPerformance[]>([]);
  const [diseaseFrequency, setDiseaseFrequency] = useState<DiseaseFrequency[]>([]);
  const [healthDistribution, setHealthDistribution] = useState<HealthDistribution[]>([]);
  const [predictionConfidence, setPredictionConfidence] = useState<number>(0);
  const [forecastTrend, setForecastTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const fetchData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);

    try {
      // ── 1. Trees ──────────────────────────────────────────────────────────
      const treesSnap = await getDocs(collection(db, 'farms', farmId, 'trees'));
      const trees = treesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

      const totalTrees = trees.length;
      const healthyTrees = trees.filter(
        (t) => (t.healthStatus ?? '').toLowerCase() === 'healthy',
      ).length;
      const criticalTrees = trees.filter(
        (t) => (t.healthStatus ?? '').toLowerCase() === 'critical',
      ).length;
      const warningTrees = totalTrees - healthyTrees - criticalTrees;
      const averageHealth =
        totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 100) : 0;

      // ── 2. Tasks ──────────────────────────────────────────────────────────
      const tasksSnap = await getDocs(
        query(collection(db, 'farms', farmId, 'tasks'), orderBy('dueDate')),
      );
      const tasks = tasksSnap.docs.map((d) => d.data()) as any[];
      const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

      // ── 3. Scans ──────────────────────────────────────────────────────────
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const scansSnap = await getDocs(
        query(
          collection(db, 'farms', farmId, 'scans'),
          where('timestamp', '>=', Timestamp.fromDate(twelveMonthsAgo)),
          orderBy('timestamp', 'asc'),
        ),
      );
      const scans = scansSnap.docs.map((d) => d.data()) as any[];

      // ── 4. Users (active farmers) ─────────────────────────────────────────
      let activeFarmers = 0;
      try {
        const usersSnap = await getDocs(
          query(
            collection(db, 'users'),
            where('farmId', '==', farmId),
          ),
        );
        activeFarmers = usersSnap.size;
      } catch {
        activeFarmers = 0;
      }

      // ── 5. Disease frequency from scans ───────────────────────────────────
      const diseaseCount: Record<string, number> = {};
      scans.forEach((s) => {
        const d = s.detectedDisease ?? 'Unknown';
        diseaseCount[d] = (diseaseCount[d] ?? 0) + 1;
      });

      const severityMap: Record<string, DiseaseFrequency['severity']> = {
        Anthracnose: 'critical',
        'Powdery Mildew': 'high',
        'Bacterial Black Spot': 'high',
        'Stem End Rot': 'medium',
        'Sooty Mold': 'medium',
        'Leaf Blight': 'low',
        'Gall Midge': 'low',
        Healthy: 'low',
      };

      const maxCount = Math.max(...Object.values(diseaseCount), 1);
      const diseaseFreq: DiseaseFrequency[] = Object.entries(diseaseCount)
        .filter(([name]) => name !== 'Healthy' && name !== 'None')
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({
          diseaseName: name,
          count,
          severity:
            severityMap[name] ??
            (count / maxCount > 0.6
              ? 'critical'
              : count / maxCount > 0.4
              ? 'high'
              : count / maxCount > 0.2
              ? 'medium'
              : 'low'),
        }));

      // ── 6. Monthly yield trend & forecast via linear regression ───────────
      // Bucket scans into months → derive health ratio → estimate yield
      const monthlyHealthMap: Record<string, { healthy: number; total: number }> = {};
      scans.forEach((s) => {
        const ts: Date = s.timestamp?.toDate?.() ?? new Date(0);
        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyHealthMap[key]) monthlyHealthMap[key] = { healthy: 0, total: 0 };
        monthlyHealthMap[key].total += 1;
        const disease = (s.detectedDisease ?? '').toLowerCase();
        if (disease === 'healthy' || disease === 'none' || disease === '') {
          monthlyHealthMap[key].healthy += 1;
        }
      });

      // Build 12-month rolling window
      const months: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const currentMonthIdx = now.getMonth();
      const baseYield = totalTrees > 0 ? totalTrees * 22 : 3000;

      const historicalYields: number[] = months.slice(0, 9).map((key) => {
        const bucket = monthlyHealthMap[key];
        if (bucket && bucket.total > 0) {
          const healthRatio = bucket.healthy / bucket.total;
          return estimateYieldFromHealth(healthRatio * 100, totalTrees || 130);
        }
        // Fallback: use overall health + seasonal variation
        const monthNum = parseInt(key.split('-')[1]) - 1;
        const seasonal = 1 + 0.15 * Math.sin(((monthNum - 2) * Math.PI) / 6);
        return Math.round(baseYield * (averageHealth / 100) * seasonal * (0.85 + Math.random() * 0.15));
      });

      // Regression on the last 9 months to predict next 3
      const reg = linearRegression(historicalYields);
      setPredictionConfidence(Math.round(Math.max(0, Math.min(100, reg.r2 * 100))));
      setForecastTrend(reg.slope > 50 ? 'up' : reg.slope < -50 ? 'down' : 'stable');

      const trends: YieldTrend[] = months.map((key, i) => {
        const monthNum = parseInt(key.split('-')[1]) - 1;
        const label = MONTH_LABELS[monthNum];
        const isPast = i < 9;
        const currentYield = isPast ? historicalYields[i] : undefined;

        // Prev year estimate
        const prevSeasonal = 1 + 0.12 * Math.sin(((monthNum - 2) * Math.PI) / 6);
        const previousYear = Math.round(
          baseYield * 0.9 * prevSeasonal * (averageHealth / 100),
        );

        // Forecast for last 3 months
        const forecast = !isPast
          ? Math.max(
              0,
              Math.round(reg.slope * (i) + reg.intercept),
            )
          : undefined;

        // Confidence bands (±1 std dev of residuals)
        const residuals = historicalYields.map(
          (y, j) => y - (reg.slope * j + reg.intercept),
        );
        const stdDev = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / residuals.length);
        const forecastUpper = forecast !== undefined ? Math.round(forecast + stdDev) : undefined;
        const forecastLower = forecast !== undefined ? Math.max(0, Math.round(forecast - stdDev)) : undefined;

        return {
          period: label,
          yield: currentYield,
          forecast,
          forecastUpper,
          forecastLower,
          previousYear,
        };
      });

      // ── 7. Total yield (sum of historical months) ─────────────────────────
      const totalYield = historicalYields.reduce((a, b) => a + b, 0);

      // ── 8. Cluster performance ─────────────────────────────────────────────
      const clustersSnap = await getDocs(collection(db, 'farms', farmId, 'clusters'));
      const clusterDocs = clustersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

      const clusterPerf: ClusterPerformance[] = await Promise.all(
        clusterDocs.slice(0, 8).map(async (cluster) => {
          const clusterTrees = trees.filter(
            (t) => t.cluster === cluster.id || t.cluster === cluster.name,
          );
          const clusterHealthy = clusterTrees.filter(
            (t) => (t.healthStatus ?? '').toLowerCase() === 'healthy',
          ).length;
          const healthPct =
            clusterTrees.length > 0
              ? Math.round((clusterHealthy / clusterTrees.length) * 100)
              : 0;
          const yieldPerTree = Math.round(22 * (0.4 + 0.6 * (healthPct / 100)));
          const totalClusterYield = yieldPerTree * clusterTrees.length;

          // Trend: compare health to overall average
          const trendPct = healthPct - averageHealth;

          return {
            clusterId: cluster.id,
            clusterName: cluster.name ?? cluster.id,
            farmId: farmId,
            farmName: cluster.farmName ?? 'Your Farm',
            treeCount: clusterTrees.length,
            healthyPercentage: healthPct,
            yieldPerTree,
            totalYield: totalClusterYield,
            trend: trendPct > 5 ? 'up' : trendPct < -5 ? 'down' : 'stable',
            trendPercentage: trendPct,
          } as ClusterPerformance;
        }),
      );

      // ── 9. Health distribution ────────────────────────────────────────────
      const healthDist: HealthDistribution[] = [
        {
          status: 'healthy',
          count: healthyTrees,
          percentage: totalTrees > 0 ? Math.round((healthyTrees / totalTrees) * 100) : 0,
        },
        {
          status: 'warning',
          count: warningTrees,
          percentage: totalTrees > 0 ? Math.round((warningTrees / totalTrees) * 100) : 0,
        },
        {
          status: 'critical',
          count: criticalTrees,
          percentage: totalTrees > 0 ? Math.round((criticalTrees / totalTrees) * 100) : 0,
        },
      ];

      // ── 10. Overall stats ────────────────────────────────────────────────
      let farmCount = 1;
      try {
        const farmsSnap = await getDocs(
          query(collection(db, 'farms'), where('ownerId', '==', farmId)),
        );
        farmCount = Math.max(1, farmsSnap.size);
      } catch {
        farmCount = 1;
      }

      setOverallStats({
        totalFarms: farmCount,
        totalTrees,
        totalYield,
        averageHealth,
        activeFarmers,
        pendingTasks,
      });
      setYieldTrends(trends);
      setClusterPerformance(
        clusterPerf.length > 0
          ? clusterPerf
          : generateFallbackClusters(trees, averageHealth),
      );
      setDiseaseFrequency(diseaseFreq.length > 0 ? diseaseFreq : generateFallbackDiseases());
      setHealthDistribution(healthDist);
    } catch (err) {
      console.error('❌ useAnalytics fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [farmId, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    overallStats,
    yieldTrends,
    clusterPerformance,
    diseaseFrequency,
    healthDistribution,
    predictionConfidence,
    forecastTrend,
    refetch: fetchData,
  };
}

// ─── Fallbacks when DB has no cluster/disease data yet ────────────────────────
function generateFallbackClusters(trees: any[], avgHealth: number): ClusterPerformance[] {
  const names = ['North Orchard', 'South Orchard', 'East Block', 'West Block'];
  const chunk = Math.ceil(trees.length / 4) || 1;
  return names.map((name, i) => {
    const h = Math.min(100, Math.max(0, avgHealth + (i % 2 === 0 ? 5 : -5)));
    const ypt = Math.round(22 * (0.4 + 0.6 * (h / 100)));
    return {
      clusterId: `c${i + 1}`,
      clusterName: name,
      farmId: '',
      farmName: 'Your Farm',
      treeCount: chunk,
      healthyPercentage: h,
      yieldPerTree: ypt,
      totalYield: ypt * chunk,
      trend: h > avgHealth ? 'up' : h < avgHealth ? 'down' : 'stable',
      trendPercentage: h - avgHealth,
    };
  });
}

function generateFallbackDiseases(): DiseaseFrequency[] {
  return [
    { diseaseName: 'Anthracnose', count: 45, severity: 'critical' },
    { diseaseName: 'Powdery Mildew', count: 32, severity: 'high' },
    { diseaseName: 'Bacterial Black Spot', count: 28, severity: 'high' },
    { diseaseName: 'Stem End Rot', count: 18, severity: 'medium' },
    { diseaseName: 'Sooty Mold', count: 12, severity: 'medium' },
    { diseaseName: 'Leaf Blight', count: 8, severity: 'low' },
  ];
}
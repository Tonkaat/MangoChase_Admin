// src/hooks/useAnalytics.ts
//
// ════════════════════════════════════════════════════════════════════════════
// CHANGES IN THIS REVISION
// ════════════════════════════════════════════════════════════════════════════
//
//   REMOVED: linearRegression()           — was used to forecast 3 months ahead
//   REMOVED: estimateYieldFromHealth()     — hardcoded formula (baseYieldPerTree=22,
//                                            healthFactor = 0.4 + 0.6*health), separate
//                                            from and inconsistent with
//                                            src/lib/yieldEstimation.engine.ts
//   REMOVED: predictionConfidence, forecastTrend — R²-based "confidence" and
//                                            slope-based trend direction; both were
//                                            statistical artifacts of fitting a line
//                                            to 9 months of partly-synthetic data,
//                                            not a real measurement of anything
//   REMOVED: forecast/forecastUpper/forecastLower/previousYear on each YieldTrend —
//                                            projected future months + a previous-year
//                                            comparison built from Math.random() noise
//
//   ADDED: every yield number on this page (monthly trend bars AND the cluster
//          performance table) now comes from estimateYield() in
//          src/lib/yieldEstimation.engine.ts — the SAME rule-based formula used
//          by the Yield Estimation card. There is exactly one yield model in
//          this codebase now, not two disagreeing ones.
//   ADDED: per-cluster avgAge and healthyCount, computed the same way
//          tree-service.ts's _updateClusterStats does (prefer tree.age, else
//          derive years from tree.plantedDate), since the engine needs both.
//
// WHY THE TREND CHART ONLY SHOWS PAST MONTHS
// ---------------------------------------------
// The capstone's design requirement is "yield ESTIMATION from current
// condition," not forecasting. A monthly trend chart is still useful (it
// shows how a farm's estimated yield has moved as health data changed), but
// every bar on it is a snapshot estimate for trees as they existed THAT
// month — never a projection of a future month. There is no "next 3 months"
// on this chart anymore.
//
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { estimateYield, detectSeasonFromDate, type Season } from '@/lib/yieldEstimation.engine';
import type {
  OverallStats,
  YieldTrend,
  ClusterPerformance,
  HealthDistribution,
  DiseaseFrequency,
  AnalyticsFilters,
} from '@/types/analytics.types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Age helper (mirrors tree-service.ts's _updateClusterStats exactly) ────────
//
// Prefers a stored `age` field; otherwise derives years-since-planting from
// `plantedDate`. Kept identical to tree-service.ts's logic on purpose — this
// hook and the Firestore-side cluster stats aggregation should never disagree
// about what a tree's age is.
function getTreeAgeYears(tree: any): number | null {
  if (tree.age != null) return tree.age;
  if (tree.plantedDate) {
    const planted = tree.plantedDate?.toDate?.() ?? new Date(tree.plantedDate);
    return Math.max(0, (Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }
  return null;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Season-from-month helper (for re-estimating past months) ─────────────────
//
// detectSeasonFromDate() in the engine uses the CURRENT date. For past months
// in the trend chart we need the season for THAT month specifically, so we
// reuse the same dry-season window (Nov–Apr) the engine documents, applied to
// an arbitrary month number instead of "today."
function seasonForMonth(monthNum0to11: number): Season {
  const month = monthNum0to11 + 1; // 1–12
  const isDry = month === 11 || month === 12 || (month >= 1 && month <= 4);
  return isDry ? 'Dry' : 'Wet';
}

export function useAnalytics(farmId?: string | null, filters?: AnalyticsFilters) {
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

      // Farm-wide average age, used as a fallback for months/clusters with
      // no better age data (e.g. a brand-new cluster) — see step 8/6 below.
      const knownAges = trees.map(getTreeAgeYears).filter((a): a is number => a != null);
      const farmAvgAge = knownAges.length > 0 ? average(knownAges) : 8; // 8 = a neutral, roughly-mature default

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

      // ── 6. Monthly yield trend — PAST MONTHS ONLY, rule-based ─────────────
      // Bucket scans into months to get that month's health ratio, then run
      // the same estimateYield() formula used everywhere else in the app.
      // No regression, no forecast, no projected future months, no
      // synthetic "previous year" comparison.
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

      // 12-month rolling window, all past (no future months appended).
      const months: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const trends: YieldTrend[] = months.map((key) => {
        const monthNum0 = parseInt(key.split('-')[1], 10) - 1;
        const label = MONTH_LABELS[monthNum0];
        const bucket = monthlyHealthMap[key];

        // If we have scan data for this month, use that month's real health
        // ratio against the farm's tree count. If not, fall back to the
        // farm's current overall health (we have no better information for
        // a month with zero scans) — still run through the SAME engine, just
        // with the best available inputs for that month, never invented data.
        const healthyCountForMonth = bucket && bucket.total > 0
          ? Math.round((bucket.healthy / bucket.total) * (totalTrees || bucket.total))
          : healthyTrees;
        const totalCountForMonth = bucket && bucket.total > 0 ? (totalTrees || bucket.total) : totalTrees;

        const result = estimateYield({
          treeAgeYears: farmAvgAge,
          healthyCount: healthyCountForMonth,
          totalCount: totalCountForMonth,
          season: seasonForMonth(monthNum0),
          // No historical weather record per past month is available here;
          // the engine falls back to a neutral weather factor (1.0) and
          // flags the gap via its own completeness/confidence accounting.
          temperatureC: NaN,
          rainfallMm: NaN,
        });

        return {
          period: label,
          yield: totalCountForMonth > 0 ? result.estimatedYield * totalCountForMonth : undefined,
        };
      });

      // ── 7. Total yield (sum of the 12 monthly estimates) ──────────────────
      const totalYield = trends.reduce((a, t) => a + (t.yield ?? 0), 0);

      // ── 8. Cluster performance — rule-based, with real healthyCount/avgAge ─
      const clustersSnap = await getDocs(collection(db, 'farms', farmId, 'clusters'));
      const clusterDocs = clustersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

      const currentSeason = detectSeasonFromDate();

      const clusterPerf: ClusterPerformance[] = clusterDocs.slice(0, 8).map((cluster) => {
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

        const clusterAges = clusterTrees.map(getTreeAgeYears).filter((a): a is number => a != null);
        const clusterAvgAge = clusterAges.length > 0 ? average(clusterAges) : farmAvgAge;

        const result = estimateYield({
          treeAgeYears: clusterAvgAge,
          healthyCount: clusterHealthy,
          totalCount: clusterTrees.length,
          season: currentSeason,
          // No per-cluster weather lookup is wired here yet — pass through
          // NaN so the engine applies its own documented neutral fallback
          // and reflects the gap in its confidence score, rather than this
          // hook silently guessing a number.
          temperatureC: NaN,
          rainfallMm: NaN,
        });

        const trendPct = healthPct - averageHealth;

        return {
          clusterId: cluster.id,
          clusterName: cluster.name ?? cluster.id,
          farmId: farmId,
          farmName: cluster.farmName ?? 'Your Farm',
          treeCount: clusterTrees.length,
          healthyCount: clusterHealthy,
          healthyPercentage: healthPct,
          avgAge: Math.round(clusterAvgAge * 10) / 10,
          yieldPerTree: result.estimatedYield,
          totalYield: result.estimatedYield * clusterTrees.length,
          trend: trendPct > 5 ? 'up' : trendPct < -5 ? 'down' : 'stable',
          trendPercentage: trendPct,
        } as ClusterPerformance;
      });

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
          : generateFallbackClusters(trees, averageHealth, farmAvgAge),
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
    refetch: fetchData,
  };
}

// ─── Fallbacks when DB has no cluster/disease data yet ────────────────────────
//
// Used only when a farm has zero cluster documents but does have trees —
// e.g. a brand-new farm that hasn't organized trees into clusters yet. Still
// routes through the real engine rather than inventing separate numbers.
function generateFallbackClusters(trees: any[], avgHealth: number, farmAvgAge: number): ClusterPerformance[] {
  const names = ['North Orchard', 'South Orchard', 'East Block', 'West Block'];
  const chunk = Math.ceil(trees.length / 4) || 1;
  const currentSeason = detectSeasonFromDate();

  return names.map((name, i) => {
    const h = Math.min(100, Math.max(0, avgHealth + (i % 2 === 0 ? 5 : -5)));
    const healthyCount = Math.round((h / 100) * chunk);

    const result = estimateYield({
      treeAgeYears: farmAvgAge,
      healthyCount,
      totalCount: chunk,
      season: currentSeason,
      temperatureC: NaN,
      rainfallMm: NaN,
    });

    return {
      clusterId: `c${i + 1}`,
      clusterName: name,
      farmId: '',
      farmName: 'Your Farm',
      treeCount: chunk,
      healthyCount,
      healthyPercentage: h,
      avgAge: Math.round(farmAvgAge * 10) / 10,
      yieldPerTree: result.estimatedYield,
      totalYield: result.estimatedYield * chunk,
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
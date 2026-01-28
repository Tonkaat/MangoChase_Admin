import { useState, useEffect, useCallback } from 'react';
import type {
  OverallStats,
  YieldTrend,
  ClusterPerformance,
  HealthDistribution,
  DiseaseFrequency,
  AnalyticsFilters,
} from '@/types/analytics.types';

// Mock data generators
const generateYieldTrends = (): YieldTrend[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => ({
    period: month,
    yield: Math.floor(Math.random() * 5000) + 3000,
    forecast: i >= 9 ? Math.floor(Math.random() * 5000) + 3500 : undefined,
    previousYear: Math.floor(Math.random() * 4500) + 2800,
  }));
};

const generateClusterPerformance = (): ClusterPerformance[] => {
  const clusters = [
    { id: 'c1', name: 'North Orchard', farm: 'Green Valley Farm' },
    { id: 'c2', name: 'South Orchard', farm: 'Green Valley Farm' },
    { id: 'c3', name: 'East Block', farm: 'Sunrise Mangoes' },
    { id: 'c4', name: 'West Block', farm: 'Sunrise Mangoes' },
    { id: 'c5', name: 'Main Grove', farm: 'Golden Harvest' },
    { id: 'c6', name: 'River Side', farm: 'Riverside Farms' },
  ];

  return clusters.map((c) => ({
    clusterId: c.id,
    clusterName: c.name,
    farmId: c.farm.toLowerCase().replace(/\s/g, '-'),
    farmName: c.farm,
    treeCount: Math.floor(Math.random() * 200) + 50,
    healthyPercentage: Math.floor(Math.random() * 30) + 70,
    yieldPerTree: Math.floor(Math.random() * 30) + 15,
    totalYield: Math.floor(Math.random() * 3000) + 1000,
    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
    trendPercentage: Math.floor(Math.random() * 20) - 5,
  }));
};

const generateDiseaseFrequency = (): DiseaseFrequency[] => {
  const diseases: DiseaseFrequency[] = [
    { diseaseName: 'Anthracnose', count: 45, severity: 'critical' },
    { diseaseName: 'Powdery Mildew', count: 32, severity: 'high' },
    { diseaseName: 'Bacterial Black Spot', count: 28, severity: 'high' },
    { diseaseName: 'Stem End Rot', count: 18, severity: 'medium' },
    { diseaseName: 'Sooty Mold', count: 12, severity: 'medium' },
    { diseaseName: 'Leaf Blight', count: 8, severity: 'low' },
    { diseaseName: 'Gall Midge', count: 5, severity: 'low' },
  ];
  return diseases.sort((a, b) => b.count - a.count);
};

const generateHealthDistribution = (): HealthDistribution[] => {
  const healthy = Math.floor(Math.random() * 20) + 70;
  const warning = Math.floor(Math.random() * 15) + 10;
  const critical = 100 - healthy - warning;
  return [
    { status: 'healthy', count: healthy * 10, percentage: healthy },
    { status: 'warning', count: warning * 10, percentage: warning },
    { status: 'critical', count: critical * 10, percentage: critical },
  ];
};

export function useAnalytics(filters?: AnalyticsFilters) {
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
    setLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    setOverallStats({
      totalFarms: 12,
      totalTrees: 2847,
      totalYield: 45680,
      averageHealth: 84,
      activeFarmers: 28,
      pendingTasks: 15,
    });
    setYieldTrends(generateYieldTrends());
    setClusterPerformance(generateClusterPerformance());
    setDiseaseFrequency(generateDiseaseFrequency());
    setHealthDistribution(generateHealthDistribution());

    setLoading(false);
  }, [filters]);

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

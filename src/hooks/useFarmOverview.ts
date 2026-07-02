// src/hooks/useFarmOverview.ts
import { useEffect, useMemo, useState } from "react";
import { treeService } from "@/services/firebase/treeService";

export interface ClusterAttention {
  name: string;
  treeCount: number;
  infectedCount: number;
  avgInfectionRate: number;
  totalMissedSprayings: number;
}

export interface FarmOverview {
  totalTrees: number;
  healthyTrees: number;
  infectedTrees: number;
  clusterCount: number;
  attentionClusters: ClusterAttention[];
  loading: boolean;
}

/**
 * Live summary of the current farm.
 *
 * IMPORTANT: this reads directly from the `trees` subcollection rather than
 * the pre-aggregated `clusters/{name}` stat docs. Those stat docs only get
 * refreshed by TreeService._updateClusterStats(), which runs when a tree is
 * added/updated/deleted *through this admin app*. Trees written by the
 * Flutter mobile app (see the "MUST MATCH FLUTTER DATABASE FIELDS" note on
 * the Tree interface in tree.types.ts) never trigger that recalculation, so
 * the cluster docs can silently drift from the real tree counts — which is
 * why the dashboard was under-reporting trees and infections. Reading the
 * trees collection directly means the numbers are always correct, no matter
 * which app wrote the tree.
 *
 * `healthStatus` can come in mixed case ('Healthy' vs 'healthy', see
 * HealthStatus in tree.types.ts), so it's lowercased before comparing —
 * the same normalization TreeService._updateClusterStats already uses.
 */
export function useFarmOverview(farmId: string | undefined): FarmOverview {
  const [trees, setTrees] = useState<Record<string, any>[]>([]);
  const [clusterNames, setClusterNames] = useState<string[]>([]);
  const [treesLoading, setTreesLoading] = useState(true);
  const [clustersLoading, setClustersLoading] = useState(true);

  useEffect(() => {
    if (!farmId) {
      setTrees([]);
      setTreesLoading(false);
      return;
    }
    setTreesLoading(true);
    const unsubscribe = treeService.getTrees(farmId, (snapshot) => {
      setTrees(snapshot.docs.map((d) => d.data()));
      setTreesLoading(false);
    });
    return unsubscribe;
  }, [farmId]);

  useEffect(() => {
    if (!farmId) {
      setClusterNames([]);
      setClustersLoading(false);
      return;
    }
    setClustersLoading(true);
    const unsubscribe = treeService.getClustersStream(farmId, (names) => {
      setClusterNames(names);
      setClustersLoading(false);
    });
    return unsubscribe;
  }, [farmId]);

  const loading = treesLoading || clustersLoading;

  return useMemo(() => {
    const totalTrees = trees.length;
    let healthyTrees = 0;
    let infectedTrees = 0;

    const byCluster = new Map<
      string,
      { treeCount: number; infectedCount: number; missedSprayings: number }
    >();

    for (const tree of trees) {
      const hs = (tree.healthStatus || "").toLowerCase();
      if (hs === "healthy") healthyTrees++;
      if (hs === "infected") infectedTrees++;

      const clusterName = tree.cluster || "Default";
      const entry =
        byCluster.get(clusterName) ?? { treeCount: 0, infectedCount: 0, missedSprayings: 0 };
      entry.treeCount += 1;
      if (hs === "infected") entry.infectedCount += 1;
      entry.missedSprayings += tree.missedSprayings || 0;
      byCluster.set(clusterName, entry);
    }

    const attentionClusters: ClusterAttention[] = Array.from(byCluster.entries())
      .map(([name, stats]) => ({
        name,
        treeCount: stats.treeCount,
        infectedCount: stats.infectedCount,
        avgInfectionRate: stats.treeCount > 0 ? stats.infectedCount / stats.treeCount : 0,
        totalMissedSprayings: stats.missedSprayings,
      }))
      .filter((c) => c.infectedCount > 0 || c.totalMissedSprayings > 0)
      .sort(
        (a, b) =>
          b.avgInfectionRate - a.avgInfectionRate ||
          b.totalMissedSprayings - a.totalMissedSprayings,
      )
      .slice(0, 5);

    return {
      totalTrees,
      healthyTrees,
      infectedTrees,
      // Counts every defined cluster, including ones with no trees yet —
      // matches what addCluster() creates before any tree is assigned to it.
      clusterCount: clusterNames.length,
      attentionClusters,
      loading,
    };
  }, [trees, clusterNames, loading]);
}
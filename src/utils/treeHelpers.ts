// src/utils/tree-helpers.ts
import { Tree, Cluster, TreeData, ClusterData, HealthStatus, GrowthStage } from "@/types/tree.types";

export function createTreeData(data: Partial<Tree>): TreeData {
  return {
    tree_id: data.tree_id,
    tree_name: data.tree_name,
    type: data.type,
    variety: data.variety,
    healthStatus: data.healthStatus,
    growthStage: data.growthStage,
    cluster: data.cluster,
    flagged: data.flagged,
    notes: data.notes,
    location: data.location,
    plantedDate: data.plantedDate,
    lastInspection: data.lastInspection,
  };
}

export function createClusterData(data: Partial<Cluster>): ClusterData {
  return {
    name: data.name || '',
    description: data.description,
    location: data.location,
  };
}
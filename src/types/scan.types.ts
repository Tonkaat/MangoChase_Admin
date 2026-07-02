// src/types/scan.types.ts

export type InfectionStatus = "healthy" | "infected";

export interface ScanRecord {
  id: string;
  treeId: string | null; // Firestore doc id of the tree, or null if unlinked
  treeName: string; // resolved from trees/{treeId}.tree_name, "Unknown Tree" if unlinked
  treeBarcodeId: string | null; // resolved from trees/{treeId}.tree_id (QR/barcode value)
  clusterName: string; // resolved from trees/{treeId}.cluster, "Unassigned" if unlinked
  imageUrl: string;
  detectedDisease: string; // e.g. "Anthracnose", "Healthy"
  infectionStatus: InfectionStatus; // derived: "Healthy" -> healthy, else infected
  confidence: number; // 0–1
  createdAt: Date; // converted from Firestore Timestamp
}

export interface ScanFiltersState {
  search: string;
  disease: string; // "all" or a detectedDisease value
  status: InfectionStatus | "all";
  cluster: string; // "all" or a cluster name
}

export const defaultScanFilters: ScanFiltersState = {
  search: "",
  disease: "all",
  status: "all",
  cluster: "all",
};

export function deriveInfectionStatus(detectedDisease: string): InfectionStatus {
  return detectedDisease?.toLowerCase() === "healthy" ? "healthy" : "infected";
}
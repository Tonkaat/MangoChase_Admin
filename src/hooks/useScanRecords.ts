// src/hooks/useScanRecords.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { scanService } from "@/services/firebase/scanService";
import { treeService } from "@/services/firebase/treeService";
import { ScanRecord, deriveInfectionStatus, deriveVerificationStatus } from "@/types/scan.types";

interface TreeLookup {
  treeName: string;
  treeBarcodeId: string | null;
  clusterName: string;
}

const UNKNOWN_TREE: TreeLookup = {
  treeName: "Unknown Tree",
  treeBarcodeId: null,
  clusterName: "Unassigned",
};

interface UseScanRecordsResult {
  scans: ScanRecord[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Subscribes to live scans + trees for a farm and joins them client-side,
 * since `clusterName` and `tree_name` live on the tree doc, not the scan doc.
 *
 * @param farmId - the active farm's id (from your farm context/provider)
 * @param scanLimit - max scans to stream, default 200
 */
export function useScanRecords(
  farmId: string | null | undefined,
  scanLimit: number = 200
): UseScanRecordsResult {
  const [rawScans, setRawScans] = useState<Record<string, any>[] | null>(null);
  const [treeMap, setTreeMap] = useState<Map<string, TreeLookup> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest farmId in a ref so cleanup always unsubscribes the right listeners
  const unsubscribesRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];

    if (!farmId) {
      setRawScans(null);
      setTreeMap(null);
      return;
    }

    setRawScans(null);
    setTreeMap(null);
    setError(null);

    const unsubScans = scanService.getScans(
      farmId,
      (snapshot) => {
        setRawScans(
          snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }))
        );
      },
      scanLimit
    );

    const unsubTrees = treeService.getTrees(farmId, (snapshot) => {
      const map = new Map<string, TreeLookup>();
      snapshot.docs.forEach((d: any) => {
        const data = d.data();
        map.set(d.id, {
          treeName: data.tree_name || `Tree ${d.id}`,
          treeBarcodeId: data.tree_id || null,
          clusterName: data.cluster || "Unassigned",
        });
      });
      setTreeMap(map);
    });

    unsubscribesRef.current = [unsubScans, unsubTrees];

    return () => {
      unsubScans();
      unsubTrees();
    };
  }, [farmId, scanLimit]);

const scans = useMemo<ScanRecord[]>(() => {
  if (!rawScans || !treeMap) return [];

  return rawScans.map((raw) => {
    const lookup = raw.treeId ? treeMap.get(raw.treeId) ?? UNKNOWN_TREE : UNKNOWN_TREE;
    const detectedDisease = raw.detectedDisease || "Unknown";
    const confidence = typeof raw.confidence === "number" ? raw.confidence : 0;

    return {
      id: raw.id,
      treeId: raw.treeId ?? null,
      treeName: lookup.treeName,
      treeBarcodeId: lookup.treeBarcodeId,
      clusterName: lookup.clusterName,
      imageUrl: raw.imageUrl,
      detectedDisease,
      infectionStatus: deriveInfectionStatus(detectedDisease),
      confidence,
      createdAt: raw.timestamp?.toDate?.() ?? new Date(0),
      verificationStatus: deriveVerificationStatus(
        detectedDisease,
        confidence,
        raw.verificationStatus
      ),
      verifiedBy: raw.verifiedBy ?? null,
      verifiedAt: raw.verifiedAt?.toDate?.() ?? null,
      expertContacted: raw.expertContacted ?? null,
    };
  });
}, [rawScans, treeMap]);

  const isLoading = !!farmId && (rawScans === null || treeMap === null);

  return { scans, isLoading, error };
}
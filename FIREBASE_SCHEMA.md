// =============================================================================
// FIRESTORE SCHEMA CHANGES — Full reference
// =============================================================================
//
// Drop this file in your project root as FIRESTORE_SCHEMA.md
// It documents every new/changed collection, field, and rule.
// =============================================================================

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  NEW FIELDS on  farms/{farmId}/trees/{treeId}                           │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * These are OPTIONAL on existing trees — the service falls back gracefully.
 * Add them when creating new trees via AddTreeModal (agronomic accordion).
 * They are also back-filled automatically when a harvest is recorded.
 *
 *   age              : number   — tree age in years
 *                                (computed from plantedDate if not present)
 *   height           : number   — tree height in metres
 *   canopySpread     : number   — canopy spread in metres
 *   lastYield        : number   — kg/tree from the most recent harvest
 *                                (written automatically by recordHarvest)
 *   missedSprayings  : number   — count of incomplete spraying tasks
 *                                in the past 90 days (synced from task system)
 *
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  UPDATED fields on  farms/{farmId}/clusters/{clusterName}               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * These are written by _updateClusterStats() after every tree mutation.
 * Existing cluster documents gain these fields automatically on the next
 * tree add/edit/delete that touches that cluster, or via recomputeAllClusterStats().
 *
 *   treeCount              : number   — live count of trees in cluster
 *   healthyCount           : number
 *   warningCount           : number
 *   criticalCount          : number
 *   avgAge                 : number   — average age (years, 1 dp)
 *   avgHeight              : number   — average height (metres, 1 dp)
 *   avgCanopySpread        : number   — average canopy (metres, 1 dp)
 *   avgLastYield           : number   — average last harvest kg/tree (1 dp)
 *   totalMissedSprayings   : number   — sum of all trees' missedSprayings
 *   varieties              : string[] — sorted distinct variety names
 *   lastUpdated            : Timestamp
 *
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  NEW COLLECTION:  farms/{farmId}/harvests/{harvestId}                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 *   clusterId        : string    — cluster document ID
 *   clusterName      : string    — human-readable cluster name
 *   harvestDate      : Timestamp
 *   totalKg          : number    — total kg harvested from cluster
 *   kgPerTree        : number    — totalKg / treeCount (auto-computed)
 *   treeCount        : number    — trees in cluster at time of harvest
 *   variety          : string?   — comma-joined varieties (informational)
 *   notes            : string?
 *   recordedBy       : string?   — UID of user who recorded
 *   createdAt        : Timestamp
 *
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  FIRESTORE SECURITY RULES (add to your rules file)                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

export const FIRESTORE_RULES_ADDITIONS = `
// Inside your existing rules for farms/{farmId} ...

// Harvests subcollection
match /farms/{farmId}/harvests/{harvestId} {
  allow read: if isAuthenticated() && isFarmMember(farmId);
  allow create: if isAuthenticated() && isFarmMember(farmId)
    && request.resource.data.keys().hasAll(['clusterId', 'clusterName', 'harvestDate', 'totalKg', 'kgPerTree', 'treeCount'])
    && request.resource.data.totalKg is number
    && request.resource.data.totalKg > 0;
  allow update: if false; // harvests are immutable; delete + recreate
  allow delete: if isAuthenticated() && isFarmAdmin(farmId);
}

// Clusters now have more fields — no rule change needed (merge: true is fine)
// Trees now have optional agronomic fields — no rule change needed
`;

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  MIGRATION — run once to populate cluster stats for existing data       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Option A (client-side, from the TreeManagement page):
 *   Click "Recompute Cluster Stats" in the sidebar.
 *   This calls firebaseService.recomputeAllClusterStats(farmId).
 *
 * Option B (Admin SDK script):
 */

export const MIGRATION_SCRIPT = `
// scripts/migrateClusterStats.ts
// Run with: npx ts-node scripts/migrateClusterStats.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccount.json';

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function migrateClusterStats(farmId: string) {
  console.log('Starting migration for farm:', farmId);

  // 1. Get all clusters
  const clustersSnap = await db.collection('farms').doc(farmId).collection('clusters').get();
  const clusterNames = clustersSnap.docs.map(d => d.data().name || d.id);

  for (const clusterName of clusterNames) {
    const treesSnap = await db.collection('farms').doc(farmId).collection('trees')
      .where('cluster', '==', clusterName).get();

    const trees = treesSnap.docs.map(d => d.data());
    const total = trees.length;

    let healthyCount = 0, warningCount = 0, criticalCount = 0;
    let ageSum = 0, ageCount = 0;
    let heightSum = 0, heightCount = 0;
    let canopySum = 0, canopyCount = 0;
    let yieldSum = 0, yieldCount = 0;
    let totalMissedSprayings = 0;
    const varietySet = new Set<string>();

    for (const tree of trees) {
      const hs = (tree.healthStatus || '').toLowerCase();
      if (hs === 'healthy') healthyCount++;
      else if (hs === 'warning') warningCount++;
      else if (hs === 'critical') criticalCount++;

      if (tree.age != null) { ageSum += tree.age; ageCount++; }
      else if (tree.plantedDate) {
        const planted = tree.plantedDate.toDate();
        const years = (Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24 * 365);
        ageSum += Math.max(0, years); ageCount++;
      }

      if (tree.height != null) { heightSum += tree.height; heightCount++; }
      if (tree.canopySpread != null) { canopySum += tree.canopySpread; canopyCount++; }
      if (tree.lastYield != null) { yieldSum += tree.lastYield; yieldCount++; }
      if (tree.missedSprayings != null) totalMissedSprayings += tree.missedSprayings;
      if (tree.variety) varietySet.add(tree.variety);
    }

    await db.collection('farms').doc(farmId).collection('clusters').doc(clusterName).set({
      treeCount: total,
      healthyCount,
      warningCount,
      criticalCount,
      avgAge: ageCount > 0 ? Math.round(ageSum / ageCount * 10) / 10 : 0,
      avgHeight: heightCount > 0 ? Math.round(heightSum / heightCount * 10) / 10 : 0,
      avgCanopySpread: canopyCount > 0 ? Math.round(canopySum / canopyCount * 10) / 10 : 0,
      avgLastYield: yieldCount > 0 ? Math.round(yieldSum / yieldCount * 10) / 10 : 0,
      totalMissedSprayings,
      varieties: Array.from(varietySet).sort(),
      lastUpdated: FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log('  ✅', clusterName, '—', total, 'trees');
  }

  console.log('Migration complete.');
}

// Replace with your actual farmId
migrateClusterStats('YOUR_FARM_ID_HERE');
`;

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TASK SYSTEM INTEGRATION (missed sprayings sync)                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Call this wherever you mark a spraying task as complete/incomplete:
 *
 *   import { treeService } from '@/services/firebase/tree-service';
 *
 *   // After updating task status:
 *   await treeService.syncMissedSprayingsForCluster(farmId, task.cluster);
 *
 * This will:
 *   1. Query tasks where type='spraying', status='incomplete', dueDate ≥ 90 days ago
 *   2. Write that count as missedSprayings to every tree in the cluster
 *   3. Recompute cluster stats (so totalMissedSprayings is current)
 *
 * Your tasks documents should have these fields for the query to work:
 *   cluster  : string    — cluster name
 *   type     : string    — 'spraying'
 *   status   : string    — 'incomplete' | 'complete'
 *   dueDate  : Timestamp
 */

export {};
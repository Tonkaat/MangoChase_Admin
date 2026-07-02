// src/services/firebase/scanNotificationService.ts

import {
  db,
  auth,
  serverTimestamp,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
} from './firebaseConfig';

import type { Unsubscribe } from 'firebase/firestore';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// FIX: Match the exact field name your Flutter addScan() writes
// Check FirebaseService.dart → addScan() 
const SCAN_DATE_FIELD = 'timestamp'; // Could be 'createdAt' or 'scannedAt'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanData {
  id: string;
  treeId?: string;
  tree_id?: string;
  detectedDisease?: string;
  disease?: string;
  confidence?: number;
  timestamp?: Timestamp;
  createdAt?: Timestamp;
  scannedAt?: Timestamp;
  [key: string]: any; // Allow other fields
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTitle(detectedDisease: string, treeName: string): string {
  if (detectedDisease?.toLowerCase() === 'healthy') {
    return `✅ Healthy scan — ${treeName}`;
  }
  return `🚨 Disease detected: ${detectedDisease}`;
}

function buildMessage(
  detectedDisease: string,
  treeName: string,
  clusterName: string,
  confidence: number,
): string {
  const pct = Math.round(confidence * 100);
  if (detectedDisease?.toLowerCase() === 'healthy') {
    return `${treeName} (${clusterName}) scanned healthy with ${pct}% confidence.`;
  }
  return `${treeName} (${clusterName}) was diagnosed with ${detectedDisease} at ${pct}% confidence. Immediate attention may be required.`;
}

function derivePriority(
  detectedDisease: string,
  confidence: number,
): 'low' | 'medium' | 'high' | 'urgent' {
  if (detectedDisease?.toLowerCase() === 'healthy') return 'low';
  if (confidence >= 0.9) return 'urgent';
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

// ─── Tree / cluster resolver ──────────────────────────────────────────────────

async function resolveTreeInfo(
  farmId: string,
  treeId: string | null,
): Promise<{ treeName: string; clusterName: string }> {
  if (!treeId) return { treeName: 'Unknown Tree', clusterName: 'Unassigned' };
  try {
    const snap = await getDoc(doc(db, 'farms', farmId, 'trees', treeId));
    if (!snap.exists()) return { treeName: 'Unknown Tree', clusterName: 'Unassigned' };
    const d = snap.data();
    return {
      treeName: d?.tree_name ?? d?.name ?? `Tree ${treeId}`,
      clusterName: d?.cluster ?? 'Unassigned',
    };
  } catch (err) {
    console.warn('resolveTreeInfo failed:', err);
    return { treeName: 'Unknown Tree', clusterName: 'Unassigned' };
  }
}

// ─── Duplicate guard ──────────────────────────────────────────────────────────

const _notifiedScanIds = new Set<string>();

// ─── Helper to extract scan data ─────────────────────────────────────────────

function extractScanData(docData: any, docId: string): ScanData {
  return {
    id: docId,
    treeId: docData.treeId ?? docData.tree_id ?? null,
    detectedDisease: docData.detectedDisease ?? docData.disease ?? 'Unknown',
    confidence: docData.confidence ?? 0,
    timestamp: docData.timestamp,
    createdAt: docData.createdAt,
    scannedAt: docData.scannedAt,
    ...docData,
  };
}

// ─── NEW: Fetch historical scans ─────────────────────────────────────────────

/**
 * Fetch recent scans that haven't been notified yet
 * This handles scans that were created while the admin client was closed
 */
async function fetchHistoricalScans(
  farmId: string,
  onNewAlert?: (notificationId: string, disease: string, treeName: string) => void,
) {
  console.log(`[ScanNotifications] Fetching historical scans for farm=${farmId}`);

  // Get last 7 days of scans
  const sevenDaysAgo = Timestamp.fromDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  try {
    // Try querying with the primary field
    let q = query(
      collection(db, 'farms', farmId, 'scans'),
      where(SCAN_DATE_FIELD, '>=', sevenDaysAgo),
      orderBy(SCAN_DATE_FIELD, 'desc'),
      limit(100),
    );

    let snapshot = await getDocs(q);
    
    // If no results, try the alternative field
    if (snapshot.empty) {
      console.log('[ScanNotifications] No scans found with primary field, trying alternative...');
      const alternativeField = SCAN_DATE_FIELD === 'timestamp' ? 'createdAt' : 'timestamp';
      q = query(
        collection(db, 'farms', farmId, 'scans'),
        where(alternativeField, '>=', sevenDaysAgo),
        orderBy(alternativeField, 'desc'),
        limit(100),
      );
      snapshot = await getDocs(q);
    }

    console.log(`[ScanNotifications] Found ${snapshot.docs.length} historical scans`);

    // Check which scans have notifications
    const scansWithNotifications = new Set<string>();
    try {
      const notifQuery = query(
        collection(db, 'farms', farmId, 'notifications'),
        where('metadata.scanId', '!=', null),
        limit(1000),
      );
      const notifSnapshot = await getDocs(notifQuery);
      notifSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.metadata?.scanId) {
          scansWithNotifications.add(data.metadata.scanId);
        }
      });
    } catch (err) {
      console.warn('[ScanNotifications] Could not check existing notifications:', err);
    }

    // Process scans without notifications
    for (const doc of snapshot.docs) {
      const rawData = doc.data();
      const scan = extractScanData(rawData, doc.id);
      const scanId = scan.id;

      // Skip if already notified
      if (_notifiedScanIds.has(scanId) || scansWithNotifications.has(scanId)) {
        continue;
      }

      _notifiedScanIds.add(scanId);

      const treeId = scan.treeId ?? null;
      const detectedDisease = scan.detectedDisease ?? 'Unknown';
      const confidence = scan.confidence ?? 0;

      console.log(`[ScanNotifications] Processing historical scan ${scanId}`);

      try {
        const { treeName, clusterName } = await resolveTreeInfo(farmId, treeId);

        const notificationPayload = {
          type: detectedDisease.toLowerCase() === 'healthy' ? 'system' : 'disease_alert',
          title: buildTitle(detectedDisease, treeName),
          message: buildMessage(detectedDisease, treeName, clusterName, confidence),
          priority: derivePriority(detectedDisease, confidence),
          isRead: false,
          createdAt: scan.timestamp || scan.createdAt || scan.scannedAt || serverTimestamp(),
          actionUrl: '/scan-records',
          actionLabel: 'View scan',
          metadata: {
            farmId,
            treeId: treeId,
            scanId: scanId,
          },
        };

        const notifRef = await addDoc(
          collection(db, 'farms', farmId, 'notifications'),
          notificationPayload,
        );

        console.log(`[ScanNotifications] ✅ Historical notification created: ${notifRef.id}`);
        onNewAlert?.(notifRef.id, detectedDisease, treeName);
      } catch (err) {
        console.error(`[ScanNotifications] ❌ Failed to create notification for scan ${scanId}:`, err);
      }
    }
  } catch (err) {
    console.error('[ScanNotifications] ❌ Error fetching historical scans:', err);
  }
}

// ─── Main listener ────────────────────────────────────────────────────────────

/**
 * Starts a real-time listener on `farms/{farmId}/scans`.
 * Also fetches historical scans that haven't been notified yet.
 *
 * @param farmId      The active farm's Firestore doc ID.
 * @param onNewAlert  Optional callback invoked with the notification ID after
 *                    each write — used for in-app toasts.
 * @returns           Firestore unsubscribe function.
 */
export function initScanNotificationListener(
  farmId: string,
  onNewAlert?: (notificationId: string, disease: string, treeName: string) => void,
): Unsubscribe {
  // FIX 1: Fetch historical scans first
  fetchHistoricalScans(farmId, onNewAlert);

  // FIX 2: Capture the exact moment the listener attaches.
  const sessionStart = Timestamp.now();

  console.log(
    `[ScanNotifications] Starting real-time listener for farm=${farmId}`,
    `| cutoff=${sessionStart.toDate().toISOString()}`,
    `| field=${SCAN_DATE_FIELD}`,
  );

  const q = query(
    collection(db, 'farms', farmId, 'scans'),
    where(SCAN_DATE_FIELD, '>=', sessionStart),
    orderBy(SCAN_DATE_FIELD, 'desc'),
    limit(50),
  );

  let isFirstSnapshot = true;

  return onSnapshot(
    q,
    async (snapshot) => {
      console.log(
        `[ScanNotifications] Snapshot received — docs=${snapshot.size}`,
        `isFirst=${isFirstSnapshot}`,
        `changes=${snapshot.docChanges().length}`,
      );

      // Skip the initial emission (pre-existing docs before session start)
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        snapshot.docs.forEach((d) => _notifiedScanIds.add(d.id));
        console.log(
          `[ScanNotifications] First snapshot seeded ${snapshot.docs.length} existing doc IDs — skipping.`,
        );
        return;
      }

      const newDocs = snapshot
        .docChanges()
        .filter((change) => change.type === 'added')
        .map((change) => {
          const rawData = change.doc.data();
          return extractScanData(rawData, change.doc.id);
        });

      console.log(`[ScanNotifications] New 'added' docs to process: ${newDocs.length}`);

      for (const scan of newDocs) {
        if (_notifiedScanIds.has(scan.id)) {
          console.log(`[ScanNotifications] Skipping duplicate scan: ${scan.id}`);
          continue;
        }
        _notifiedScanIds.add(scan.id);

        const treeId = scan.treeId ?? null;
        const detectedDisease = scan.detectedDisease ?? 'Unknown';
        const confidence = scan.confidence ?? 0;

        console.log(
          `[ScanNotifications] Processing scan=${scan.id}`,
          `disease=${detectedDisease}`,
          `confidence=${confidence}`,
          `treeId=${treeId}`,
        );

        try {
          const { treeName, clusterName } = await resolveTreeInfo(farmId, treeId);

          const notificationPayload = {
            type: detectedDisease.toLowerCase() === 'healthy' ? 'system' : 'disease_alert',
            title: buildTitle(detectedDisease, treeName),
            message: buildMessage(detectedDisease, treeName, clusterName, confidence),
            priority: derivePriority(detectedDisease, confidence),
            isRead: false,
            createdAt: serverTimestamp(),
            actionUrl: '/scan-records',
            actionLabel: 'View scan',
            metadata: {
              farmId,
              treeId: treeId,
              scanId: scan.id,
            },
          };

          const notifRef = await addDoc(
            collection(db, 'farms', farmId, 'notifications'),
            notificationPayload,
          );

          console.log(
            `[ScanNotifications] ✅ Notification created: ${notifRef.id}`,
            `| ${detectedDisease} on ${treeName}`,
          );

          onNewAlert?.(notifRef.id, detectedDisease, treeName);
        } catch (err) {
          console.error(`[ScanNotifications] ❌ Failed to write notification for scan ${scan.id}:`, err);
        }
      }
    },
    (error) => {
      console.error('[ScanNotifications] ❌ onSnapshot error:', error);

      if (error.code === 'permission-denied') {
        console.error(
          '[ScanNotifications] Permission denied — check Firestore security rules.',
          'The admin client user must have read access to farms/{farmId}/scans.',
        );
      }

      if (error.code === 'failed-precondition') {
        console.error(
          '[ScanNotifications] Missing Firestore index.',
          `Create a composite index on farms/{farmId}/scans:`,
          `  field 1: ${SCAN_DATE_FIELD} (ascending)`,
          `  field 2: ${SCAN_DATE_FIELD} (descending)`,
          'Or click the index link in the full error message above.',
        );
      }
    },
  );
}

// ─── Utility: Check scan field ──────────────────────────────────────────────

/**
 * Debug function to check what field Flutter is using for timestamps
 */
export async function debugScanField(farmId: string) {
  try {
    // Try timestamp field first
    let q = query(
      collection(db, 'farms', farmId, 'scans'),
      orderBy('timestamp', 'desc'),
      limit(1),
    );
    let snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Try createdAt
      q = query(
        collection(db, 'farms', farmId, 'scans'),
        orderBy('createdAt', 'desc'),
        limit(1),
      );
      snapshot = await getDocs(q);
    }

    if (snapshot.empty) {
      console.log('[ScanNotifications] No scans found in this farm');
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    console.log('[ScanNotifications] Scan document fields:', Object.keys(data));
    console.log('[ScanNotifications] Available date fields:', 
      ['timestamp', 'createdAt', 'scannedAt', 'created_at', 'scanned_at'].filter(f => f in data)
    );
    
    // Find which field is actually being used
    const dateFields = ['timestamp', 'createdAt', 'scannedAt', 'created_at', 'scanned_at'];
    for (const field of dateFields) {
      if (data[field]) {
        console.log(`[ScanNotifications] ✅ Using field: "${field}"`);
        break;
      }
    }
  } catch (err) {
    console.error('[ScanNotifications] Debug failed:', err);
  }
}
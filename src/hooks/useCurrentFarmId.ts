// src/hooks/useCurrentFarmId.ts
import { useEffect, useState } from "react";
import { firebaseService } from "@/services/firebase";

export interface CurrentFarmIdResult {
  farmId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Resolves the current user's active farmId.
 *
 * Mirrors the resolution Analytics.tsx does inline:
 *   1. firebaseService.getCurrentUserFarmId()
 *   2. fall back to the first farm from getUserFarms(uid)
 *   3. stay in sync via getUserProfileStream in case farmId changes
 *      (e.g. right after joining a farm via farm code)
 *
 * Pulled out here so other pages (like Dashboard) don't have to
 * copy-paste the same block Analytics.tsx already has.
 */
export function useCurrentFarmId(): CurrentFarmIdResult {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFarmId() {
      try {
        setLoading(true);
        setError(null);
        let currentFarmId = await firebaseService.getCurrentUserFarmId();
        if (!currentFarmId) {
          const user = firebaseService.getCurrentUser();
          if (user) {
            const farms = await firebaseService.getUserFarms(user.uid);
            if (farms && farms.length > 0) {
              currentFarmId = farms[0].farmId;
            }
          }
        }
        if (isMounted) {
          if (currentFarmId) {
            setFarmId(currentFarmId);
          } else {
            setError("No farm found. Please create or join a farm first.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load farm information. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    let unsubscribe: (() => void) | undefined;
    const setupUserProfileListener = async () => {
      try {
        const user = firebaseService.getCurrentUser();
        if (user) {
          unsubscribe = firebaseService.getUserProfileStream((userProfile) => {
            if (isMounted && userProfile?.farmId) setFarmId(userProfile.farmId);
          });
        }
      } catch {
        // non-fatal — the one-off lookup above still stands
      }
    };

    loadFarmId();
    setupUserProfileListener();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { farmId, loading, error };
}
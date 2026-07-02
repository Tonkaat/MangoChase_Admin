// src/pages/DiseaseScanRecords.tsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScanSearch, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { firebaseService } from "@/services/firebase";
import { useScanRecords } from "@/hooks/useScanRecords";
import { ScanCard } from "@/components/scans/ScanCard";
import { ScanFilters } from "@/components/scans/ScanFilters";
import { ScanDetailsModal } from "@/components/scans/ScanDetailsModal";
import {
  ScanRecord,
  ScanFiltersState,
  defaultScanFilters,
} from "@/types/scan.types";

// ── Pagination Configuration ──
const ITEMS_PER_PAGE = 8;
const PAGINATION_RANGE = 2; // Number of page buttons to show on each side

export default function DiseaseScanRecords() {
  // ── Resolve the active farmId, same approach as Analytics.tsx ──
  const [farmId, setFarmId] = useState<string | null>(null);
  const [farmLoading, setFarmLoading] = useState(true);
  const [farmError, setFarmError] = useState<string | null>(null);

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadFarmId() {
      try {
        setFarmLoading(true);
        setFarmError(null);
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
            setFarmError("No farm found. Please create or join a farm first.");
            toast.error("No farm found. Please create or join a farm first.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setFarmError("Failed to load farm information. Please try again.");
          toast.error("Failed to load farm information");
        }
      } finally {
        if (isMounted) setFarmLoading(false);
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
      } catch {}
    };

    loadFarmId();
    setupUserProfileListener();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ── Live scan + tree join, scoped to the resolved farmId ──
  const { scans, isLoading: scansLoading, error: scansError } = useScanRecords(farmId);
  const [filters, setFilters] = useState<ScanFiltersState>(defaultScanFilters);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  const diseaseOptions = useMemo(
    () =>
      Array.from(new Set(scans.map((s) => s.detectedDisease))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [scans]
  );

  const clusterOptions = useMemo(
    () =>
      Array.from(new Set(scans.map((s) => s.clusterName))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [scans]
  );

  // ── Filter and Paginate Scans ──
  const filteredScans = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return scans.filter((scan) => {
      const matchesSearch =
        q.length === 0 ||
        scan.treeName.toLowerCase().includes(q) ||
        (scan.treeBarcodeId?.toLowerCase().includes(q) ?? false);
      const matchesDisease =
        filters.disease === "all" || scan.detectedDisease === filters.disease;
      const matchesStatus =
        filters.status === "all" || scan.infectionStatus === filters.status;
      const matchesCluster =
        filters.cluster === "all" || scan.clusterName === filters.cluster;

      return matchesSearch && matchesDisease && matchesStatus && matchesCluster;
    });
  }, [scans, filters]);

  // ── Pagination Calculations ──
  const totalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredScans.length);
  const currentScans = filteredScans.slice(startIndex, endIndex);

  // ── Reset to page 1 when filters change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ── Pagination Controls ──
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const total = totalPages;

    if (total <= 7) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      let startPage = Math.max(2, currentPage - PAGINATION_RANGE);
      let endPage = Math.min(total - 1, currentPage + PAGINATION_RANGE);

      if (currentPage <= PAGINATION_RANGE + 1) {
        endPage = PAGINATION_RANGE * 2 + 1;
      }

      if (currentPage >= total - PAGINATION_RANGE) {
        startPage = total - PAGINATION_RANGE * 2;
      }

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < total) {
          pages.push(i);
        }
      }

      if (endPage < total - 1) {
        pages.push("...");
      }

      // Show last page
      if (total > 1) {
        pages.push(total);
      }
    }

    return pages;
  };

  // ── Farm resolution states ──
  if (farmLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading farm information...</p>
        </div>
      </div>
    );
  }

  if (farmError || !farmId) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-amber-100 p-3 w-fit mx-auto mb-4">
            <ScanSearch className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Farm Found</h2>
          <p className="text-muted-foreground mb-4">
            {farmError || "You don't have an active farm."}
          </p>
          <button
            onClick={() => (window.location.href = "/farm-setup")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create or Join a Farm
          </button>
        </div>
      </div>
    );
  }

  // ── Main content ──
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Disease Detection Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Live AI scan results from mango leaf disease detection.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredScans.length} record{filteredScans.length !== 1 ? "s" : ""}
        </div>
      </div>

      <ScanFilters
        filters={filters}
        onChange={setFilters}
        diseaseOptions={diseaseOptions}
        clusterOptions={clusterOptions}
      />

      {scansLoading && (
        <div className="flex items-center justify-center rounded-xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!scansLoading && scansError && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center shadow-soft">
          <RefreshCw className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{scansError}</p>
          <p className="text-xs text-muted-foreground">
            Check the connection and try again.
          </p>
        </div>
      )}

      {!scansLoading && !scansError && filteredScans.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center shadow-soft">
          <ScanSearch className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No scan records match these filters.
          </p>
          <p className="text-xs text-muted-foreground">
            Try a different Tree ID or adjust the filters above.
          </p>
        </div>
      )}

      {!scansLoading && !scansError && filteredScans.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentScans.map((scan) => (
              <ScanCard key={scan.id} scan={scan} onClick={setSelectedScan} />
            ))}
          </div>

          {/* ── Streamlined Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Showing {startIndex + 1}–{endIndex} of {filteredScans.length}
              </div>

              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <button
                      key={index}
                      onClick={() => goToPage(page)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
                      }`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={index} className="px-1 text-muted-foreground">
                      {page}
                    </span>
                  )
                )}

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ScanDetailsModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
    </div>
  );
}
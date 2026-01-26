import { useState, useEffect, useCallback } from 'react';
import { boardService } from '@/services/firebase/boardService';
import {
  CommunityPost,
  TradeListing,
  MarketPrice,
  DiseaseAlert,
  FarmerProfile,
  BoardStats,
  PostCategory,
  ListingType,
  VerificationTier,
} from '@/types/board.types';

export function useBoardStats() {
  const [stats, setStats] = useState<BoardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await boardService.getBoardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching board stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export function useCommunityPosts(filters?: {
  category?: PostCategory;
  approved?: boolean;
  pinned?: boolean;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.approved, filters?.pinned]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const approvePost = async (postId: string) => {
    await boardService.approvePost(postId);
    fetchPosts();
  };

  const removePost = async (postId: string) => {
    await boardService.removePost(postId);
    fetchPosts();
  };

  const pinPost = async (postId: string, pinned: boolean) => {
    await boardService.pinPost(postId, pinned);
    fetchPosts();
  };

  return { posts, loading, refetch: fetchPosts, approvePost, removePost, pinPost };
}

export function useTradeListings(filters?: {
  type?: ListingType;
  status?: string;
}) {
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getListings(filters);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [filters?.type, filters?.status]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const approveListing = async (listingId: string) => {
    await boardService.approveListing(listingId);
    fetchListings();
  };

  const removeListing = async (listingId: string) => {
    await boardService.removeListing(listingId);
    fetchListings();
  };

  return { listings, loading, refetch: fetchListings, approveListing, removeListing };
}

export function useMarketPrices(filters?: {
  region?: string;
  variety?: string;
}) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getMarketPrices(filters);
      setPrices(data);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    } finally {
      setLoading(false);
    }
  }, [filters?.region, filters?.variety]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const updatePrice = async (priceId: string, updates: Partial<MarketPrice>) => {
    await boardService.updateMarketPrice(priceId, updates);
    fetchPrices();
  };

  const validatePrice = async (priceId: string) => {
    await boardService.validateMarketPrice(priceId);
    fetchPrices();
  };

  return { prices, loading, refetch: fetchPrices, updatePrice, validatePrice };
}

export function useDiseaseAlerts(filters?: {
  approved?: boolean;
  severity?: string;
  region?: string;
}) {
  const [alerts, setAlerts] = useState<DiseaseAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getDiseaseAlerts(filters);
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching disease alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters?.approved, filters?.severity, filters?.region]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const approveAlert = async (alertId: string) => {
    await boardService.approveAlert(alertId);
    fetchAlerts();
  };

  const pinAlert = async (alertId: string, pinned: boolean) => {
    await boardService.pinAlert(alertId, pinned);
    fetchAlerts();
  };

  return { alerts, loading, refetch: fetchAlerts, approveAlert, pinAlert };
}

export function useFarmerVerification(filters?: {
  verificationStatus?: string;
  tier?: VerificationTier;
}) {
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardService.getFarmers(filters);
      setFarmers(data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters?.verificationStatus, filters?.tier]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const verifyFarmer = async (farmerId: string, tier: VerificationTier, notes?: string) => {
    await boardService.verifyFarmer(farmerId, tier, notes);
    fetchFarmers();
  };

  const suspendFarmer = async (farmerId: string, reason: string) => {
    await boardService.suspendFarmer(farmerId, reason);
    fetchFarmers();
  };

  const reactivateFarmer = async (farmerId: string) => {
    await boardService.reactivateFarmer(farmerId);
    fetchFarmers();
  };

  return { farmers, loading, refetch: fetchFarmers, verifyFarmer, suspendFarmer, reactivateFarmer };
}

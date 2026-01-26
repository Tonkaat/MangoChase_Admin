// Farmer's Board Service - Firebase/Firestore integration
// This service handles all board-related data operations

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

// Mock data for development - will be replaced with Firebase calls
const generateMockPosts = (): CommunityPost[] => {
  const categories: PostCategory[] = ['experience', 'disease_alert', 'market_info', 'general', 'announcement'];
  const posts: CommunityPost[] = [
    {
      id: '1',
      farmerId: 'farmer-1',
      farmerName: 'Juan dela Cruz',
      farmerTier: 'trusted',
      title: 'Best practices for mango flowering season',
      content: 'After 15 years of farming, I\'ve learned that timing is everything during flowering season. Here are my top tips for maximizing fruit set...',
      category: 'experience',
      isPinned: true,
      isApproved: true,
      likes: 45,
      commentsCount: 12,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      farmerId: 'farmer-2',
      farmerName: 'Maria Santos',
      farmerTier: 'verified',
      title: 'Anthracnose outbreak in Batangas region',
      content: 'Warning to all farmers in Batangas! We\'ve detected anthracnose in several farms. Please check your trees for black spots on fruits and leaves.',
      category: 'disease_alert',
      isPinned: true,
      isApproved: true,
      likes: 28,
      commentsCount: 8,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      farmerId: 'farmer-3',
      farmerName: 'Pedro Reyes',
      farmerTier: 'basic',
      title: 'Current mango prices in Manila markets',
      content: 'Just visited Divisoria market today. Carabao mangoes are selling at ₱80-95/kg, while Apple mangoes are at ₱120-140/kg.',
      category: 'market_info',
      isPinned: false,
      isApproved: true,
      likes: 34,
      commentsCount: 5,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      farmerId: 'admin-1',
      farmerName: 'MangoChase Admin',
      farmerTier: 'trusted',
      title: 'New fertilizer subsidy program for registered farmers',
      content: 'The Department of Agriculture has announced a new fertilizer subsidy program. All verified farmers can apply starting next week.',
      category: 'announcement',
      isPinned: true,
      isApproved: true,
      likes: 67,
      commentsCount: 23,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '5',
      farmerId: 'farmer-4',
      farmerName: 'Ana Gonzales',
      farmerTier: 'verified',
      title: 'Question about organic pest control',
      content: 'Has anyone tried using neem oil for mango hoppers? Looking for organic alternatives to chemical pesticides.',
      category: 'general',
      isPinned: false,
      isApproved: true,
      likes: 12,
      commentsCount: 18,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: '6',
      farmerId: 'farmer-5',
      farmerName: 'Roberto Lim',
      farmerTier: 'basic',
      title: 'Powdery mildew spreading in our barangay',
      content: 'Several trees in our area showing white powder on leaves. Need admin verification.',
      category: 'disease_alert',
      isPinned: false,
      isApproved: false,
      likes: 5,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ];
  return posts;
};

const generateMockListings = (): TradeListing[] => {
  return [
    {
      id: '1',
      farmerId: 'farmer-1',
      farmerName: 'Juan dela Cruz',
      farmerTier: 'trusted',
      type: 'surplus',
      variety: 'Carabao',
      quantity: 500,
      unit: 'kg',
      pricePerUnit: 85,
      description: 'Grade A Carabao mangoes from our farm. Harvested this week, perfect ripeness.',
      location: 'Zambales',
      contactInfo: '0917-xxx-xxxx',
      status: 'active',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      farmerId: 'farmer-2',
      farmerName: 'Maria Santos',
      farmerTier: 'verified',
      type: 'selling',
      variety: 'Apple Mango',
      quantity: 200,
      unit: 'kg',
      pricePerUnit: 130,
      description: 'Premium Apple Mangoes, export quality. Can negotiate for bulk orders.',
      location: 'Batangas',
      contactInfo: '0918-xxx-xxxx',
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      farmerId: 'farmer-6',
      farmerName: 'Carlos Mendoza',
      farmerTier: 'verified',
      type: 'buying',
      variety: 'Carabao',
      quantity: 1000,
      unit: 'kg',
      description: 'Looking for Grade A Carabao mangoes for export. Willing to pay premium prices.',
      location: 'Manila',
      contactInfo: '0919-xxx-xxxx',
      status: 'active',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      farmerId: 'farmer-7',
      farmerName: 'Elena Ramos',
      farmerTier: 'basic',
      type: 'shortage',
      variety: 'Pico',
      quantity: 300,
      unit: 'kg',
      description: 'Our harvest was affected by pests. Need Pico mangoes to fulfill existing orders.',
      location: 'Pangasinan',
      contactInfo: '0920-xxx-xxxx',
      status: 'pending',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];
};

const generateMockMarketPrices = (): MarketPrice[] => {
  return [
    {
      id: '1',
      region: 'Luzon - Central',
      variety: 'Carabao',
      priceMin: 75,
      priceMax: 95,
      priceAverage: 85,
      unit: 'kg',
      trend: 'up',
      percentageChange: 5.2,
      validatedBy: 'admin-1',
      validatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      region: 'Luzon - Central',
      variety: 'Apple Mango',
      priceMin: 110,
      priceMax: 145,
      priceAverage: 128,
      unit: 'kg',
      trend: 'stable',
      percentageChange: 0.8,
      validatedBy: 'admin-1',
      validatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: '3',
      region: 'Visayas - Western',
      variety: 'Carabao',
      priceMin: 70,
      priceMax: 88,
      priceAverage: 79,
      unit: 'kg',
      trend: 'down',
      percentageChange: -3.1,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      id: '4',
      region: 'Mindanao - Davao',
      variety: 'Carabao',
      priceMin: 65,
      priceMax: 82,
      priceAverage: 74,
      unit: 'kg',
      trend: 'up',
      percentageChange: 2.8,
      validatedBy: 'admin-2',
      validatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: '5',
      region: 'Luzon - North',
      variety: 'Pico',
      priceMin: 55,
      priceMax: 70,
      priceAverage: 62,
      unit: 'kg',
      trend: 'stable',
      percentageChange: 0.2,
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    },
  ];
};

const generateMockDiseaseAlerts = (): DiseaseAlert[] => {
  return [
    {
      id: '1',
      farmerId: 'farmer-2',
      farmerName: 'Maria Santos',
      diseaseType: 'anthracnose',
      severity: 'high',
      title: 'Anthracnose outbreak in Batangas farms',
      description: 'Multiple farms in Batangas province are reporting anthracnose infections. The wet season has accelerated the spread.',
      symptoms: ['Black spots on fruits', 'Leaf blight', 'Premature fruit drop'],
      affectedArea: 'San Jose, Batangas',
      region: 'Luzon - South',
      isPinned: true,
      isApproved: true,
      approvedBy: 'admin-1',
      approvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      id: '2',
      farmerId: 'farmer-1',
      farmerName: 'Juan dela Cruz',
      diseaseType: 'mango_hopper',
      severity: 'medium',
      title: 'Mango hopper infestation spreading',
      description: 'Mango hoppers are affecting flowering trees in Zambales. Recommend immediate pest control measures.',
      symptoms: ['Flower drying', 'Sooty mold on leaves', 'Reduced fruit set'],
      affectedArea: 'Iba, Zambales',
      region: 'Luzon - Central',
      isPinned: false,
      isApproved: true,
      approvedBy: 'admin-1',
      approvedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    },
    {
      id: '3',
      farmerId: 'farmer-5',
      farmerName: 'Roberto Lim',
      diseaseType: 'powdery_mildew',
      severity: 'medium',
      title: 'Possible powdery mildew in Pangasinan',
      description: 'White powdery substance observed on several trees. Awaiting expert verification.',
      symptoms: ['White powder on leaves', 'Leaf curling'],
      affectedArea: 'Dagupan, Pangasinan',
      region: 'Luzon - North',
      isPinned: false,
      isApproved: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ];
};

const generateMockFarmers = (): FarmerProfile[] => {
  return [
    {
      id: 'farmer-1',
      farmId: 'farm-1',
      name: 'Juan dela Cruz',
      email: 'juan@email.com',
      phone: '0917-123-4567',
      location: 'Zambales',
      verificationTier: 'trusted',
      verificationStatus: 'approved',
      verifiedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      verifiedBy: 'admin-1',
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'farmer-2',
      farmId: 'farm-2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '0918-234-5678',
      location: 'Batangas',
      verificationTier: 'verified',
      verificationStatus: 'approved',
      verifiedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      verifiedBy: 'admin-1',
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'farmer-3',
      farmId: 'farm-3',
      name: 'Pedro Reyes',
      email: 'pedro@email.com',
      location: 'Manila',
      verificationTier: 'basic',
      verificationStatus: 'pending',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'farmer-4',
      farmId: 'farm-4',
      name: 'Ana Gonzales',
      email: 'ana@email.com',
      phone: '0920-456-7890',
      location: 'Cebu',
      verificationTier: 'verified',
      verificationStatus: 'approved',
      verifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      verifiedBy: 'admin-2',
      createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'farmer-5',
      farmId: 'farm-5',
      name: 'Roberto Lim',
      email: 'roberto@email.com',
      location: 'Pangasinan',
      verificationTier: 'basic',
      verificationStatus: 'pending',
      verificationNotes: 'Submitted ID documents for review',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'farmer-6',
      farmId: 'farm-6',
      name: 'Carlos Mendoza',
      email: 'carlos@email.com',
      phone: '0919-567-8901',
      location: 'Manila',
      verificationTier: 'verified',
      verificationStatus: 'approved',
      verifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      verifiedBy: 'admin-1',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'farmer-7',
      farmId: 'farm-7',
      name: 'Elena Ramos',
      email: 'elena@email.com',
      location: 'Pangasinan',
      verificationTier: 'basic',
      verificationStatus: 'rejected',
      verificationNotes: 'Documents unclear, please resubmit',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
};

class BoardService {
  // ========== Community Posts ==========
  async getPosts(filters?: {
    category?: PostCategory;
    approved?: boolean;
    pinned?: boolean;
  }): Promise<CommunityPost[]> {
    let posts = generateMockPosts();
    
    if (filters?.category) {
      posts = posts.filter(p => p.category === filters.category);
    }
    if (filters?.approved !== undefined) {
      posts = posts.filter(p => p.isApproved === filters.approved);
    }
    if (filters?.pinned) {
      posts = posts.filter(p => p.isPinned);
    }
    
    // Sort: pinned first, then by date
    return posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async approvePost(postId: string): Promise<void> {
    console.log('Approving post:', postId);
  }

  async removePost(postId: string): Promise<void> {
    console.log('Removing post:', postId);
  }

  async pinPost(postId: string, pinned: boolean): Promise<void> {
    console.log('Pinning post:', postId, pinned);
  }

  // ========== Trade Listings ==========
  async getListings(filters?: {
    type?: ListingType;
    status?: string;
  }): Promise<TradeListing[]> {
    let listings = generateMockListings();
    
    if (filters?.type) {
      listings = listings.filter(l => l.type === filters.type);
    }
    if (filters?.status) {
      listings = listings.filter(l => l.status === filters.status);
    }
    
    return listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async approveListing(listingId: string): Promise<void> {
    console.log('Approving listing:', listingId);
  }

  async removeListing(listingId: string): Promise<void> {
    console.log('Removing listing:', listingId);
  }

  // ========== Market Prices ==========
  async getMarketPrices(filters?: {
    region?: string;
    variety?: string;
  }): Promise<MarketPrice[]> {
    let prices = generateMockMarketPrices();
    
    if (filters?.region) {
      prices = prices.filter(p => p.region === filters.region);
    }
    if (filters?.variety) {
      prices = prices.filter(p => p.variety === filters.variety);
    }
    
    return prices.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateMarketPrice(priceId: string, updates: Partial<MarketPrice>): Promise<void> {
    console.log('Updating market price:', priceId, updates);
  }

  async validateMarketPrice(priceId: string): Promise<void> {
    console.log('Validating market price:', priceId);
  }

  // ========== Disease Alerts ==========
  async getDiseaseAlerts(filters?: {
    approved?: boolean;
    severity?: string;
    region?: string;
  }): Promise<DiseaseAlert[]> {
    let alerts = generateMockDiseaseAlerts();
    
    if (filters?.approved !== undefined) {
      alerts = alerts.filter(a => a.isApproved === filters.approved);
    }
    if (filters?.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters?.region) {
      alerts = alerts.filter(a => a.region === filters.region);
    }
    
    // Sort: pinned first, then by severity, then by date
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return alerts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async approveAlert(alertId: string): Promise<void> {
    console.log('Approving alert:', alertId);
  }

  async pinAlert(alertId: string, pinned: boolean): Promise<void> {
    console.log('Pinning alert:', alertId, pinned);
  }

  // ========== Farmer Verification ==========
  async getFarmers(filters?: {
    verificationStatus?: string;
    tier?: VerificationTier;
  }): Promise<FarmerProfile[]> {
    let farmers = generateMockFarmers();
    
    if (filters?.verificationStatus) {
      farmers = farmers.filter(f => f.verificationStatus === filters.verificationStatus);
    }
    if (filters?.tier) {
      farmers = farmers.filter(f => f.verificationTier === filters.tier);
    }
    
    return farmers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async verifyFarmer(farmerId: string, tier: VerificationTier, notes?: string): Promise<void> {
    console.log('Verifying farmer:', farmerId, tier, notes);
  }

  async suspendFarmer(farmerId: string, reason: string): Promise<void> {
    console.log('Suspending farmer:', farmerId, reason);
  }

  async reactivateFarmer(farmerId: string): Promise<void> {
    console.log('Reactivating farmer:', farmerId);
  }

  // ========== Stats ==========
  async getBoardStats(): Promise<BoardStats> {
    const posts = generateMockPosts();
    const listings = generateMockListings();
    const alerts = generateMockDiseaseAlerts();
    const farmers = generateMockFarmers();
    
    return {
      totalPosts: posts.length,
      pendingApproval: posts.filter(p => !p.isApproved).length + alerts.filter(a => !a.isApproved).length,
      activeListings: listings.filter(l => l.status === 'active').length,
      pendingVerifications: farmers.filter(f => f.verificationStatus === 'pending').length,
      activeAlerts: alerts.filter(a => a.isApproved).length,
      farmersCount: farmers.length,
      verifiedFarmers: farmers.filter(f => f.verificationTier === 'verified').length,
      trustedFarmers: farmers.filter(f => f.verificationTier === 'trusted').length,
    };
  }
}

export const boardService = new BoardService();

// Farmer's Board Management Types

// ========== Farmer Verification ==========
export type VerificationTier = 'basic' | 'verified' | 'trusted';

export interface FarmerProfile {
  id: string;
  farmId: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  verificationTier: VerificationTier;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  verificationDocuments?: string[];
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  suspendedAt?: Date;
  suspendedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const VERIFICATION_TIER_CONFIG: Record<VerificationTier, {
  label: string;
  description: string;
  color: string;
  privileges: string[];
}> = {
  basic: {
    label: 'Basic',
    description: 'New farmer with limited privileges',
    color: 'bg-muted text-muted-foreground',
    privileges: ['View posts', 'View market prices', 'Create basic posts'],
  },
  verified: {
    label: 'Verified',
    description: 'Identity verified by admin',
    color: 'bg-secondary text-secondary-foreground',
    privileges: ['All basic privileges', 'Create trade listings', 'Report disease alerts', 'Access surplus declarations'],
  },
  trusted: {
    label: 'Trusted',
    description: 'Long-standing verified farmer with excellent track record',
    color: 'bg-primary text-primary-foreground',
    privileges: ['All verified privileges', 'Pin community posts', 'Update market prices', 'Mentor new farmers'],
  },
};

// ========== Community Posts ==========
export type PostCategory = 'experience' | 'disease_alert' | 'market_info' | 'general' | 'announcement';

export interface CommunityPost {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerTier: VerificationTier;
  title: string;
  content: string;
  category: PostCategory;
  images?: string[];
  isPinned: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  likes: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const POST_CATEGORY_CONFIG: Record<PostCategory, {
  label: string;
  icon: string;
  color: string;
  description: string;
  requiresApproval: boolean;
}> = {
  experience: {
    label: 'Experience Sharing',
    icon: 'MessageCircle',
    color: 'bg-secondary/20 text-secondary',
    description: 'Share farming experiences and tips',
    requiresApproval: false,
  },
  disease_alert: {
    label: 'Disease Alert',
    icon: 'AlertTriangle',
    color: 'bg-destructive/20 text-destructive',
    description: 'Report disease outbreaks and warnings',
    requiresApproval: true,
  },
  market_info: {
    label: 'Market Information',
    icon: 'TrendingUp',
    color: 'bg-primary/20 text-primary-foreground',
    description: 'Share market updates and trends',
    requiresApproval: false,
  },
  general: {
    label: 'General',
    icon: 'FileText',
    color: 'bg-muted text-muted-foreground',
    description: 'General discussions and questions',
    requiresApproval: false,
  },
  announcement: {
    label: 'Announcement',
    icon: 'Megaphone',
    color: 'bg-accent text-accent-foreground',
    description: 'Official announcements from admins',
    requiresApproval: false,
  },
};

// ========== Trade Listings ==========
export type ListingType = 'surplus' | 'shortage' | 'selling' | 'buying';
export type ListingStatus = 'active' | 'pending' | 'completed' | 'expired' | 'removed';

export interface TradeListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerTier: VerificationTier;
  type: ListingType;
  variety: string;
  quantity: number;
  unit: 'kg' | 'tons' | 'pieces' | 'crates';
  pricePerUnit?: number;
  description: string;
  location: string;
  contactInfo: string;
  images?: string[];
  status: ListingStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const LISTING_TYPE_CONFIG: Record<ListingType, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  surplus: {
    label: 'Crop Surplus',
    icon: 'TrendingUp',
    color: 'bg-secondary/20 text-secondary',
    description: 'Excess harvest available',
  },
  shortage: {
    label: 'Crop Shortage',
    icon: 'TrendingDown',
    color: 'bg-destructive/20 text-destructive',
    description: 'Need additional supply',
  },
  selling: {
    label: 'For Sale',
    icon: 'DollarSign',
    color: 'bg-primary/20 text-primary-foreground',
    description: 'Mangoes available for purchase',
  },
  buying: {
    label: 'Looking to Buy',
    icon: 'ShoppingCart',
    color: 'bg-accent text-accent-foreground',
    description: 'Seeking to purchase mangoes',
  },
};

// ========== Market Prices ==========
export interface MarketPrice {
  id: string;
  region: string;
  variety: string;
  priceMin: number;
  priceMax: number;
  priceAverage: number;
  unit: 'kg' | 'crate';
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceHistory {
  id: string;
  marketPriceId: string;
  priceAverage: number;
  recordedAt: Date;
}

export const MANGO_VARIETIES = [
  'Carabao',
  'Pico',
  'Apple Mango',
  'Indian Mango',
  'Katchamitha',
  'Pahutan',
] as const;

export const REGIONS = [
  'Luzon - North',
  'Luzon - Central',
  'Luzon - South',
  'Visayas - Western',
  'Visayas - Central',
  'Visayas - Eastern',
  'Mindanao - Northern',
  'Mindanao - Davao',
  'Mindanao - SOCCSKSARGEN',
] as const;

// ========== Disease Alerts ==========
export type DiseaseType = 'anthracnose' | 'powdery_mildew' | 'bacterial_black_spot' | 'stem_end_rot' | 'mango_hopper' | 'fruit_fly' | 'other';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DiseaseAlert {
  id: string;
  farmerId: string;
  farmerName: string;
  diseaseType: DiseaseType;
  customDiseaseName?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  symptoms: string[];
  affectedArea: string;
  region: string;
  images?: string[];
  isPinned: boolean;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const DISEASE_TYPE_CONFIG: Record<DiseaseType, {
  label: string;
  description: string;
  commonSymptoms: string[];
}> = {
  anthracnose: {
    label: 'Anthracnose',
    description: 'Fungal disease causing black spots on fruits and leaves',
    commonSymptoms: ['Black spots on fruits', 'Leaf blight', 'Flower blight'],
  },
  powdery_mildew: {
    label: 'Powdery Mildew',
    description: 'White powdery growth on leaves and flowers',
    commonSymptoms: ['White powder on leaves', 'Distorted leaves', 'Flower drop'],
  },
  bacterial_black_spot: {
    label: 'Bacterial Black Spot',
    description: 'Bacterial infection causing dark lesions',
    commonSymptoms: ['Angular black spots', 'Leaf curling', 'Fruit cracking'],
  },
  stem_end_rot: {
    label: 'Stem End Rot',
    description: 'Post-harvest disease affecting fruit stem',
    commonSymptoms: ['Brown discoloration at stem', 'Soft rot', 'Fruit drop'],
  },
  mango_hopper: {
    label: 'Mango Hopper',
    description: 'Insect pest affecting flowers and young fruits',
    commonSymptoms: ['Flower drying', 'Sooty mold', 'Reduced fruit set'],
  },
  fruit_fly: {
    label: 'Fruit Fly',
    description: 'Insect pest causing fruit damage',
    commonSymptoms: ['Puncture marks', 'Larvae in fruit', 'Premature fruit drop'],
  },
  other: {
    label: 'Other Disease/Pest',
    description: 'Other disease or pest not listed',
    commonSymptoms: [],
  },
};

export const SEVERITY_CONFIG: Record<AlertSeverity, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  medium: {
    label: 'Medium',
    color: 'text-primary-foreground',
    bgColor: 'bg-primary',
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  critical: {
    label: 'Critical',
    color: 'text-destructive-foreground',
    bgColor: 'bg-destructive',
  },
};

// ========== Board Stats ==========
export interface BoardStats {
  totalPosts: number;
  pendingApproval: number;
  activeListings: number;
  pendingVerifications: number;
  activeAlerts: number;
  farmersCount: number;
  verifiedFarmers: number;
  trustedFarmers: number;
}

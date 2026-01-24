// Types for farm setup wizard

export interface VarietyConfig {
  id: string;
  name: string;
  quantity: number;
}

export interface AgeGroupConfig {
  id: string;
  age: number;
  quantity: number;
  label: string;
}

export interface FarmSetupData {
  // Step 1: Farm Info
  farmName: string;
  farmLocation: string;
  cropType: string;
  
  // Step 2: Farm Details
  farmSize: number;
  numberOfTrees: number;
  farmingType: string;
  
  // Step 3: Variety Configuration
  varieties: VarietyConfig[];
  
  // Step 4: Age Configuration
  ageGroups: AgeGroupConfig[];
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  farmSize: number;
  numberOfTrees: number;
  cropType: string;
  farmingType: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  setupComplete?: boolean;
}

export interface FarmStatistics {
  totalTrees: number;
  healthyTrees: number;
  flaggedTrees: number;
  pendingTasks: number;
  completedTasks: number;
  recentScans: number;
}

export const CROP_TYPES = [
  { value: 'mango', label: 'Mango', icon: '🥭' },
  { value: 'mixed_fruits', label: 'Mixed Fruits', icon: '🍎' },
  { value: 'coconut', label: 'Coconut', icon: '🥥' },
  { value: 'citrus', label: 'Citrus', icon: '🍊' },
  { value: 'other', label: 'Other', icon: '🌳' },
] as const;

export const FARMING_TYPES = [
  { value: 'personal', label: 'Personal', description: 'Small family farm' },
  { value: 'commercial', label: 'Commercial', description: 'Large-scale production' },
  { value: 'cooperative', label: 'Cooperative', description: 'Community-owned farm' },
] as const;

export const DEFAULT_MANGO_VARIETIES = [
  'Carabao',
  'Pico',
  'Apple Mango',
  'Indian Mango',
  'Kent',
  'Tommy Atkins',
] as const;

export const GROWTH_STAGES = [
  { minAge: 0, maxAge: 2, label: 'Seedling', color: 'emerald' },
  { minAge: 2, maxAge: 5, label: 'Young', color: 'lime' },
  { minAge: 5, maxAge: 10, label: 'Mature', color: 'green' },
  { minAge: 10, maxAge: 100, label: 'Old', color: 'amber' },
] as const;

export function getGrowthStageForAge(age: number): string {
  if (age < 2) return 'Seedling';
  if (age < 5) return 'Young';
  if (age < 10) return 'Mature';
  return 'Old';
}

export function generateUniqueId(): string {
  return `TREE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

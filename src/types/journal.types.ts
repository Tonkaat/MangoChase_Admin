// Journal Types

export type JournalEntryType = 'activity' | 'disease_detection' | 'note' | 'milestone';

export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title: string;
  description: string;
  date: Date;
  userId: string;
  userName: string;
  farmId?: string;
  farmName?: string;
  treeId?: string;
  clusterId?: string;
  // For disease detection entries
  diseaseInfo?: {
    diseaseName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    leafImages: string[];
    recommendations?: string[];
    status: 'detected' | 'treated' | 'resolved';
  };
  // For notes
  noteContent?: string;
  tags?: string[];
  // For activities
  activityType?: 'harvest' | 'fertilize' | 'prune' | 'spray' | 'inspection' | 'planting' | 'other';
  isPinned?: boolean;
}

export interface JournalFilters {
  type?: JournalEntryType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  farmId?: string;
  search?: string;
}

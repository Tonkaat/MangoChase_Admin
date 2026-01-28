import { useState, useEffect, useCallback } from 'react';
import type { JournalEntry, JournalFilters } from '@/types/journal.types';

// Mock data generator
const generateMockEntries = (): JournalEntry[] => {
  const entries: JournalEntry[] = [
    {
      id: 'j1',
      type: 'disease_detection',
      title: 'Anthracnose Detected on Tree #142',
      description: 'Black spots observed on leaves in North Orchard cluster. Immediate treatment recommended.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: 'u1',
      userName: 'Maria Santos',
      farmId: 'f1',
      farmName: 'Green Valley Farm',
      treeId: 't142',
      clusterId: 'c1',
      diseaseInfo: {
        diseaseName: 'Anthracnose',
        severity: 'high',
        leafImages: [
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
          'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        ],
        recommendations: ['Apply copper-based fungicide', 'Remove infected leaves', 'Improve air circulation'],
        status: 'detected',
      },
      isPinned: true,
    },
    {
      id: 'j2',
      type: 'activity',
      title: 'Fertilizer Application Completed',
      description: 'Applied NPK 14-14-14 fertilizer to all trees in South Orchard. 2kg per tree.',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      userId: 'u2',
      userName: 'Juan dela Cruz',
      farmId: 'f1',
      farmName: 'Green Valley Farm',
      activityType: 'fertilize',
    },
    {
      id: 'j3',
      type: 'note',
      title: 'Weather Observation',
      description: 'Noticed increased humidity this week. Should monitor for fungal diseases.',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      userId: 'u1',
      userName: 'Maria Santos',
      noteContent: 'The humidity levels have been consistently above 80% for the past 3 days. This creates favorable conditions for anthracnose and powdery mildew. Recommend increasing inspection frequency and preparing fungicide spray.',
      tags: ['weather', 'prevention', 'monitoring'],
    },
    {
      id: 'j4',
      type: 'disease_detection',
      title: 'Powdery Mildew - Early Stage',
      description: 'White powdery coating found on young leaves in East Block.',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      userId: 'u3',
      userName: 'Pedro Reyes',
      farmId: 'f2',
      farmName: 'Sunrise Mangoes',
      treeId: 't89',
      diseaseInfo: {
        diseaseName: 'Powdery Mildew',
        severity: 'medium',
        leafImages: [
          'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400',
        ],
        recommendations: ['Apply sulfur-based fungicide', 'Prune affected areas'],
        status: 'treated',
      },
    },
    {
      id: 'j5',
      type: 'milestone',
      title: '🎉 First Harvest of the Season!',
      description: 'Successfully harvested 500kg of Carabao mangoes from Green Valley Farm.',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      userId: 'u1',
      userName: 'Maria Santos',
      farmId: 'f1',
      farmName: 'Green Valley Farm',
      isPinned: true,
    },
    {
      id: 'j6',
      type: 'activity',
      title: 'Pruning Session - Block A',
      description: 'Completed pruning of 45 trees in Block A. Removed dead branches and shaped canopy.',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      userId: 'u2',
      userName: 'Juan dela Cruz',
      farmId: 'f1',
      farmName: 'Green Valley Farm',
      activityType: 'prune',
    },
    {
      id: 'j7',
      type: 'note',
      title: 'Soil Testing Results',
      description: 'Received soil test results for North Orchard. pH levels are slightly acidic.',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      userId: 'u1',
      userName: 'Maria Santos',
      farmId: 'f1',
      farmName: 'Green Valley Farm',
      noteContent: 'Soil pH: 5.8 (slightly acidic). Nitrogen: adequate. Phosphorus: low. Potassium: adequate. Recommendation: Apply lime to raise pH and add phosphorus supplement.',
      tags: ['soil', 'testing', 'nutrition'],
    },
    {
      id: 'j8',
      type: 'disease_detection',
      title: 'Bacterial Black Spot Resolved',
      description: 'Previous infection on Tree #67 has been successfully treated and resolved.',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      userId: 'u3',
      userName: 'Pedro Reyes',
      farmId: 'f2',
      farmName: 'Sunrise Mangoes',
      treeId: 't67',
      diseaseInfo: {
        diseaseName: 'Bacterial Black Spot',
        severity: 'low',
        leafImages: [
          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        ],
        status: 'resolved',
      },
    },
  ];

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export function useJournal(filters?: JournalFilters) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    let data = generateMockEntries();

    if (filters?.type) {
      data = data.filter((e) => e.type === filters.type);
    }
    if (filters?.farmId) {
      data = data.filter((e) => e.farmId === filters.farmId);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.description.toLowerCase().includes(search)
      );
    }

    setEntries(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `j${Date.now()}`,
      date: new Date(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const togglePin = async (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e))
    );
  };

  const deleteEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    loading,
    entries,
    addEntry,
    togglePin,
    deleteEntry,
    refetch: fetchEntries,
  };
}

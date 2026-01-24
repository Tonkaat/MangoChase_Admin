// src/services/farmService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
}

class FarmService {
  async createFarm(data: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const farmsRef = collection(db, 'farms');
    const newFarmRef = doc(farmsRef);
    
    await setDoc(newFarmRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newFarmRef.id;
  }

  async getFarm(farmId: string): Promise<Farm | null> {
    const farmRef = doc(db, 'farms', farmId);
    const farmDoc = await getDoc(farmRef);

    if (!farmDoc.exists()) {
      return null;
    }

    const data = farmDoc.data();
    return {
      id: farmDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Farm;
  }

  async updateFarm(farmId: string, updates: Partial<Farm>): Promise<void> {
    const farmRef = doc(db, 'farms', farmId);
    await updateDoc(farmRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
}

export const farmService = new FarmService();
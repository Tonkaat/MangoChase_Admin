// src/types/task.types.ts

export type TaskType = 
  | 'watering' 
  | 'fertilizing' 
  | 'pruning' 
  | 'inspection' 
  | 'pestControl' 
  | 'harvesting'
  | 'general';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  farmId: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  completedAt?: Date;
  assignedTo?: string;
  clusterId?: string;
  clusterName?: string;
  treeIds?: string[];
  notes?: string;
  isAIGenerated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  todaysTasks: number;
  weeklyTasks: number;
}

// Weather types
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  forecast: WeatherForecast[];
  lastUpdated: Date;
}

export interface WeatherForecast {
  date: Date;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export interface AIScheduleConfig {
  farmId: string;
  location: string;
  daysToGenerate: number;
  considerWeather: boolean;
  considerFarmHealth: boolean;
  considerSeasonalTasks: boolean;
}

// Task type configurations
export const TASK_TYPE_CONFIG: Record<TaskType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  watering: {
    label: 'Watering',
    icon: 'Droplets',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  fertilizing: {
    label: 'Fertilizing',
    icon: 'Leaf',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  pruning: {
    label: 'Pruning',
    icon: 'Scissors',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  inspection: {
    label: 'Inspection',
    icon: 'Search',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  pestControl: {
    label: 'Pest Control',
    icon: 'Bug',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  harvesting: {
    label: 'Harvesting',
    icon: 'Apple',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  general: {
    label: 'General',
    icon: 'ClipboardList',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  low: {
    label: 'Low',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  high: {
    label: 'High',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};
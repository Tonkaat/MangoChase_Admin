// src/services/aiSchedulingService.ts
// WEEKLY GENERATION VERSION - 7-day cooldown with notification

import { firebaseService } from './firebase';
import { Timestamp, collection, doc, getDoc, setDoc } from 'firebase/firestore';

// ===== ENUMS =====
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskSource {
  AI = 'ai',
  RULE = 'rule',
  DISEASE = 'disease',
  ROUTINE = 'routine',
  CLUSTER_SPECIFIC = 'cluster_specific'
}

export enum TaskScope {
  FARM_WIDE = 'farm_wide',
  CLUSTER_SPECIFIC = 'cluster_specific',
  TREE_SPECIFIC = 'tree_specific'
}

// ===== INTERFACES =====
export interface ScheduledTask {
  title: string;
  date: Date;
  priority: TaskPriority;
  reason: string;
  description: string;
  source: TaskSource;
  scope: TaskScope;
  targetClusters: string[];
  category?: string;
}

export interface WeatherData {
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        avgTempC: number;
        totalPrecipMm: number;
        chanceOfRain: number;
        maxWindKph: number;
        [key: string]: any;
      };
    }>;
  };
  [key: string]: any;
}

export interface FarmContext {
  statistics?: Record<string, any>;
  recent_scans?: any[];
  cluster_stats?: Record<string, any>;
  clusters?: string[];
}

interface UsedTimeSlot {
  hour: number;
  categories: string[];
}

// ===== TASK HELPERS =====
export class ScheduledTaskHelper {
  static getDisplayTitle(task: ScheduledTask): string {
    if (task.targetClusters.length > 0) {
      const clusterList = task.targetClusters.length > 2
        ? `${task.targetClusters.slice(0, 2).join(', ')} +${task.targetClusters.length - 2} more`
        : task.targetClusters.join(', ');
      return `${task.title} (${clusterList})`;
    }
    return task.title;
  }

  static getUniqueKey(task: ScheduledTask): string {
    const dateKey = `${task.date.getFullYear()}-${String(task.date.getMonth() + 1).padStart(2, '0')}-${String(task.date.getDate()).padStart(2, '0')}`;
    const categoryKey = (task.category || 'general').toLowerCase().replace(/\s/g, '_');
    
    if (task.targetClusters.length === 0) {
      return `${dateKey}_${categoryKey}_farmwide`;
    }
    
    const sortedClusters = [...task.targetClusters].sort();
    const clusterKey = sortedClusters.join('_').toLowerCase();
    return `${dateKey}_${categoryKey}_${clusterKey}`;
  }

  static getFingerprint(task: ScheduledTask): string {
    const titleWords = task.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .sort();
    
    const dateKey = `${task.date.getFullYear()}${task.date.getMonth() + 1}${task.date.getDate()}`;
    const categoryKey = (task.category || 'general').toLowerCase();
    
    return `${dateKey}_${categoryKey}_${titleWords.join('_')}`;
  }
}

// ===== SEASONAL KNOWLEDGE =====
const SEASONAL_CALENDAR: Record<string, { stage: string }> = {
  january: { stage: 'flowering' },
  february: { stage: 'flowering' },
  march: { stage: 'fruit_setting' },
  april: { stage: 'fruit_development' },
  may: { stage: 'fruit_development' },
  june: { stage: 'harvesting' },
  july: { stage: 'vegetative' },
  august: { stage: 'vegetative' },
  september: { stage: 'vegetative' },
  october: { stage: 'vegetative' },
  november: { stage: 'pre_flowering' },
  december: { stage: 'pre_flowering' },
};

// ===== MAIN CLASS =====
export class EnhancedAIScheduler {
  private static readonly GENERATION_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor(
    private weatherService: any,
    private aiService: any,
    private notificationService: any
  ) {}

  // ===== PUBLIC METHODS =====

  /**
   * Check if farm has any upcoming tasks
   */
  async hasUpcomingTasks(farmId: string): Promise<boolean> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysLater = new Date(startOfToday.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const tasks = await firebaseService.getTasksInDateRange(farmId, {
        startDate: startOfToday,
        endDate: sevenDaysLater,
      });
      
      let upcomingCount = 0;
      
      for (const task of tasks) {
        if (task.status !== 'done' && task.status !== 'completed') {
          upcomingCount++;
        }
      }
      
      console.log(`📊 Upcoming tasks in next 7 days: ${upcomingCount}`);
      return upcomingCount > 0;
    } catch (error) {
      console.error('⚠️ Error checking upcoming tasks:', error);
      return true; // Assume tasks exist on error (safer)
    }
  }

  /**
   * Get last generation timestamp from Firebase
   */
  async getLastGenerationTime(farmId: string): Promise<Date | null> {
    try {
      const docRef = doc(firebaseService.firestore, 'farms', farmId, 'metadata', 'ai_scheduler');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data()?.lastGenerationTime) {
        const timestamp = docSnap.data()!.lastGenerationTime as Timestamp;
        return timestamp.toDate();
      }
    } catch (error) {
      console.error('⚠️ Error getting last generation time:', error);
    }
    return null;
  }

  /**
   * Save generation timestamp to Firebase
   */
  private async saveGenerationTime(farmId: string): Promise<void> {
    try {
      const docRef = doc(firebaseService.firestore, 'farms', farmId, 'metadata', 'ai_scheduler');
      await setDoc(docRef, {
        lastGenerationTime: Timestamp.now(),
        nextAvailableTime: Timestamp.fromDate(
          new Date(Date.now() + EnhancedAIScheduler.GENERATION_INTERVAL)
        ),
      }, { merge: true });
    } catch (error) {
      console.error('⚠️ Error saving generation time:', error);
    }
  }

  /**
   * Check both cooldown AND if calendar is empty
   */
  async canGenerateSchedule(farmId: string): Promise<boolean> {
    // Check 1: Are there upcoming tasks?
    const hasUpcoming = await this.hasUpcomingTasks(farmId);
    if (hasUpcoming) {
      console.log('🚫 Cannot generate: Calendar has upcoming tasks');
      return false;
    }
    
    // Check 2: Has cooldown period passed?
    const lastGen = await this.getLastGenerationTime(farmId);
    if (lastGen) {
      const timeSince = Date.now() - lastGen.getTime();
      if (timeSince < EnhancedAIScheduler.GENERATION_INTERVAL) {
        const days = Math.floor(timeSince / (24 * 60 * 60 * 1000));
        console.log(`🚫 Cannot generate: Cooldown active (${days} days passed)`);
        return false;
      }
    }
    
    console.log('✅ Can generate: Calendar empty and cooldown passed');
    return true;
  }

  /**
   * Get remaining cooldown duration
   */
  async getRemainingCooldown(farmId: string): Promise<number | null> {
    const lastGen = await this.getLastGenerationTime(farmId);
    if (!lastGen) return null;
    
    const elapsed = Date.now() - lastGen.getTime();
    if (elapsed >= EnhancedAIScheduler.GENERATION_INTERVAL) return null;
    
    return EnhancedAIScheduler.GENERATION_INTERVAL - elapsed;
  }

  /**
   * Get next available generation date
   */
  async getNextAvailableDate(farmId: string): Promise<Date | null> {
    const lastGen = await this.getLastGenerationTime(farmId);
    if (!lastGen) return null;
    
    return new Date(lastGen.getTime() + EnhancedAIScheduler.GENERATION_INTERVAL);
  }

  /**
   * Send notification when ready to generate
   */
  async checkAndNotifyIfReady(farmId: string): Promise<void> {
    try {
      const canGenerate = await this.canGenerateSchedule(farmId);
      
      if (canGenerate) {
        // Check if we already sent notification today
        const notifications = await firebaseService.getNotifications(farmId);
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        let alreadyNotified = false;
        for (const notif of notifications) {
          if (notif.type === 'schedule_ready' && notif.timestamp) {
            const notifTime = (notif.timestamp as Timestamp).toDate();
            const notifDate = new Date(notifTime.getFullYear(), notifTime.getMonth(), notifTime.getDate());
            
            if (notifDate.getTime() === todayStart.getTime()) {
              alreadyNotified = true;
              break;
            }
          }
        }
        
        if (!alreadyNotified) {
          await this.notificationService.saveNotification({
            farmId,
            type: 'schedule_ready',
            title: '🤖 AI Schedule Ready',
            body: "Your calendar is clear! Generate your next week's optimized schedule.",
            data: {
              action: 'open_schedule',
              can_generate: 'true',
            },
          });
          
          console.log('📬 Sent schedule ready notification');
        }
      }
    } catch (error) {
      console.error('⚠️ Error checking schedule readiness:', error);
    }
  }

  /**
   * MAIN METHOD: Generate optimized schedule
   */
  async generateOptimizedSchedule(params: {
    farmId: string;
    location: string;
    farmData: Record<string, any>;
  }): Promise<ScheduledTask[]> {
    const { farmId, location } = params;
    
    // Validate generation is allowed
    const canGen = await this.canGenerateSchedule(farmId);
    if (!canGen) {
      const hasUpcoming = await this.hasUpcomingTasks(farmId);
      const remaining = await this.getRemainingCooldown(farmId);
      
      if (hasUpcoming) {
        throw new Error('Cannot generate: You still have pending tasks. Complete or delete them first.');
      } else if (remaining !== null) {
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        throw new Error(`Cannot generate: Wait ${days} days and ${hours} hours before next generation.`);
      } else {
        throw new Error('Cannot generate schedule at this time.');
      }
    }

    try {
      console.log('🚀 Starting weekly schedule generation');

      // Get existing tasks
      const existingTasks = await this.getAllExistingScheduledTasks(farmId);
      console.log(`📋 Found ${existingTasks.length} existing tasks`);

      // Build blocklist
      const blocklist = this.buildTaskBlocklist(existingTasks);
      console.log(`🚫 Blocklist has ${blocklist.size} entries`);

      // Get weather and farm context
      const weatherData = await this.weatherService.getWeatherForecast(location, 7);
      const farmContext = await this.getFarmContext(farmId);
      
      // Generate AI schedule
      const aiGeneratedTasks = await this.generateCompleteAISchedule({
        weatherData,
        farmContext,
        existingTasks,
        location,
      });

      console.log(`🤖 AI generated ${aiGeneratedTasks.length} tasks`);

      // Ultra-strict filtering
      const filteredTasks = this.ultraStrictDuplicatePrevention(
        aiGeneratedTasks, 
        existingTasks,
        blocklist
      );
      
      console.log(`✨ After filtering: ${filteredTasks.length} unique tasks`);

      if (filteredTasks.length === 0) {
        throw new Error('No new tasks generated. Try clearing old tasks first.');
      }

      // Assign time slots
      const finalTasks = this.assignIntelligentTimeSlots(filteredTasks, weatherData, existingTasks);

      // Final validation
      this.validateNoConflicts(finalTasks, existingTasks);

      // Save to Firebase
      await this.saveScheduledTasks(farmId, finalTasks);

      // Save generation timestamp
      await this.saveGenerationTime(farmId);

      // Send success notification
      await this.notificationService.saveNotification({
        farmId,
        type: 'ai_schedule',
        title: '✅ AI Schedule Generated',
        body: `Created ${finalTasks.length} optimized tasks for the next 7 days`,
        data: {
          taskCount: finalTasks.length,
          nextGeneration: new Date(Date.now() + EnhancedAIScheduler.GENERATION_INTERVAL).toISOString(),
        },
      });

      console.log(`✅ Successfully created ${finalTasks.length} tasks`);
      console.log(`⏰ Next generation available: ${new Date(Date.now() + EnhancedAIScheduler.GENERATION_INTERVAL)}`);
      
      return finalTasks;

    } catch (error) {
      console.error('❌ Error in schedule generation:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private buildTaskBlocklist(existingTasks: ScheduledTask[]): Set<string> {
    const blocklist = new Set<string>();
    
    for (const task of existingTasks) {
      blocklist.add(ScheduledTaskHelper.getUniqueKey(task));
      blocklist.add(ScheduledTaskHelper.getFingerprint(task));
      
      const normalizedTitle = this.normalizeTitle(task.title);
      const dateKey = `${task.date.getFullYear()}-${task.date.getMonth() + 1}-${task.date.getDate()}`;
      blocklist.add(`${dateKey}_${normalizedTitle}`);
      
      if (task.targetClusters.length === 0 && task.category) {
        blocklist.add(`${dateKey}_${task.category}_farmwide`);
      }
    }
    
    return blocklist;
  }

  private normalizeTitle(title: string): string {
    return title.toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .join('_');
  }

  private ultraStrictDuplicatePrevention(
    newTasks: ScheduledTask[], 
    existingTasks: ScheduledTask[],
    blocklist: Set<string>
  ): ScheduledTask[] {
    const uniqueTasks: ScheduledTask[] = [];
    const seenInBatch = new Set<string>();
    
    for (const newTask of newTasks) {
      let isDuplicate = false;
      
      if (blocklist.has(ScheduledTaskHelper.getUniqueKey(newTask))) {
        console.log(`🚫 BLOCKED by uniqueKey: ${newTask.title}`);
        isDuplicate = true;
      }
      
      if (!isDuplicate && blocklist.has(ScheduledTaskHelper.getFingerprint(newTask))) {
        console.log(`🚫 BLOCKED by fingerprint: ${newTask.title}`);
        isDuplicate = true;
      }
      
      if (!isDuplicate) {
        const normalizedTitle = this.normalizeTitle(newTask.title);
        const dateKey = `${newTask.date.getFullYear()}-${newTask.date.getMonth() + 1}-${newTask.date.getDate()}`;
        const checkKey = `${dateKey}_${normalizedTitle}`;
        
        if (blocklist.has(checkKey)) {
          console.log(`🚫 BLOCKED by normalized: ${newTask.title}`);
          isDuplicate = true;
        }
      }
      
      if (!isDuplicate && newTask.targetClusters.length === 0 && newTask.category) {
        const dateKey = `${newTask.date.getFullYear()}-${newTask.date.getMonth() + 1}-${newTask.date.getDate()}`;
        const checkKey = `${dateKey}_${newTask.category}_farmwide`;
        
        if (blocklist.has(checkKey)) {
          console.log(`🚫 BLOCKED by category+date: ${newTask.title}`);
          isDuplicate = true;
        }
      }
      
      if (!isDuplicate) {
        for (const existing of existingTasks) {
          if (this.areSemanticallyDuplicate(newTask, existing)) {
            console.log(`🚫 BLOCKED by semantic match: ${newTask.title} vs ${existing.title}`);
            isDuplicate = true;
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        if (seenInBatch.has(ScheduledTaskHelper.getUniqueKey(newTask)) || 
            seenInBatch.has(ScheduledTaskHelper.getFingerprint(newTask))) {
          console.log(`🚫 BLOCKED duplicate in batch: ${newTask.title}`);
          isDuplicate = true;
        }
      }
      
      if (!isDuplicate) {
        uniqueTasks.push(newTask);
        seenInBatch.add(ScheduledTaskHelper.getUniqueKey(newTask));
        seenInBatch.add(ScheduledTaskHelper.getFingerprint(newTask));
        console.log(`✅ APPROVED: ${newTask.title}`);
      }
    }
    
    return uniqueTasks;
  }

  private areSemanticallyDuplicate(task1: ScheduledTask, task2: ScheduledTask): boolean {
    if (task1.date.getFullYear() !== task2.date.getFullYear() ||
        task1.date.getMonth() !== task2.date.getMonth() ||
        task1.date.getDate() !== task2.date.getDate()) {
      return false;
    }

    if (task1.category && task2.category) {
      if (task1.category !== task2.category) {
        if (!this.areRelatedCategories(task1.category, task2.category)) {
          return false;
        }
      }
    }

    if (this.hasClusterOverlap(task1, task2)) {
      return this.areTitlesSimilar(task1.title, task2.title, 0.5);
    }

    return false;
  }

  private areRelatedCategories(cat1: string, cat2: string): boolean {
    const related: Record<string, string[]> = {
      irrigation: ['watering'],
      watering: ['irrigation'],
      pest_control: ['inspection'],
      inspection: ['pest_control'],
    };
    
    return related[cat1]?.includes(cat2) ?? false;
  }

  private hasClusterOverlap(task1: ScheduledTask, task2: ScheduledTask): boolean {
    if (task1.targetClusters.length === 0 && task2.targetClusters.length === 0) {
      return true;
    }
    
    if (task1.targetClusters.length === 0 || task2.targetClusters.length === 0) {
      return true;
    }
    
    const set1 = new Set(task1.targetClusters);
    const set2 = new Set(task2.targetClusters);
    const intersection = [...set1].filter(x => set2.has(x));
    return intersection.length > 0;
  }

  private areTitlesSimilar(title1: string, title2: string, threshold: number = 0.6): boolean {
    const words1 = new Set(
      title1.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter(w => w.length > 3)
    );
    
    const words2 = new Set(
      title2.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter(w => w.length > 3)
    );
    
    if (words1.size === 0 || words2.size === 0) return false;
    
    const common = [...words1].filter(x => words2.has(x));
    const minWords = Math.min(words1.size, words2.size);
    
    return common.length >= Math.ceil(minWords * threshold);
  }

  private validateNoConflicts(newTasks: ScheduledTask[], existingTasks: ScheduledTask[]): void {
    const conflicts: string[] = [];
    
    for (const newTask of newTasks) {
      for (const existing of existingTasks) {
        if (this.areSemanticallyDuplicate(newTask, existing)) {
          conflicts.push(
            `CONFLICT: "${newTask.title}" conflicts with existing "${existing.title}"`
          );
        }
      }
    }
    
    for (let i = 0; i < newTasks.length; i++) {
      for (let j = i + 1; j < newTasks.length; j++) {
        if (this.areSemanticallyDuplicate(newTasks[i], newTasks[j])) {
          conflicts.push(
            `INTERNAL CONFLICT: "${newTasks[i].title}" vs "${newTasks[j].title}"`
          );
        }
      }
    }
    
    if (conflicts.length > 0) {
      console.log('⚠️ VALIDATION WARNINGS:');
      conflicts.forEach(conflict => console.log(`  - ${conflict}`));
    }
  }

  private assignIntelligentTimeSlots(
    tasks: ScheduledTask[], 
    weatherData: WeatherData,
    existingTasks: ScheduledTask[]
  ): ScheduledTask[] {
    const tasksWithTime: ScheduledTask[] = [];
    
    const tasksByDate = new Map<string, ScheduledTask[]>();
    for (const task of tasks) {
      const dateKey = `${task.date.getFullYear()}-${task.date.getMonth()}-${task.date.getDate()}`;
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey)!.push(task);
    }

    for (const [dateKey, dayTasks] of tasksByDate.entries()) {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month, day);
      
      const weatherForDay = this.getWeatherForDate(weatherData, date);
      
      const existingForDay = existingTasks.filter(t =>
        t.date.getFullYear() === date.getFullYear() &&
        t.date.getMonth() === date.getMonth() &&
        t.date.getDate() === date.getDate()
      );
      
      const sortedTasks = this.sortTasksByOptimalTiming(dayTasks);
      
      const scheduledTasks = this.assignTimeSlotsWithConflictCheck(
        sortedTasks, 
        date, 
        weatherForDay,
        existingForDay
      );
      tasksWithTime.push(...scheduledTasks);
    }

    return tasksWithTime;
  }

  private assignTimeSlotsWithConflictCheck(
    tasks: ScheduledTask[], 
    date: Date,
    weather: Record<string, any> | null,
    existingTasks: ScheduledTask[]
  ): ScheduledTask[] {
    const scheduledTasks: ScheduledTask[] = [];
    const usedTimeSlots = new Map<number, string[]>();
    
    for (const existing of existingTasks) {
      const hour = existing.date.getHours();
      if (!usedTimeSlots.has(hour)) {
        usedTimeSlots.set(hour, []);
      }
      usedTimeSlots.get(hour)!.push(existing.category || 'general');
    }
    
    for (const task of tasks) {
      const timeRange = this.getOptimalTimeRange(task.category, weather);
      
      let selectedHour: number | null = null;
      for (const hour of timeRange) {
        const categoriesAtHour = usedTimeSlots.get(hour) || [];
        
        if (categoriesAtHour.length === 0 || 
            (!categoriesAtHour.includes(task.category || '') && categoriesAtHour.length < 2)) {
          selectedHour = hour;
          if (!usedTimeSlots.has(hour)) {
            usedTimeSlots.set(hour, []);
          }
          usedTimeSlots.get(hour)!.push(task.category || 'general');
          break;
        }
      }
      
      if (selectedHour === null) {
        for (let hour = 6; hour <= 18; hour++) {
          const categoriesAtHour = usedTimeSlots.get(hour) || [];
          if (categoriesAtHour.length < 2) {
            selectedHour = hour;
            if (!usedTimeSlots.has(hour)) {
              usedTimeSlots.set(hour, []);
            }
            usedTimeSlots.get(hour)!.push(task.category || 'general');
            break;
          }
        }
      }
      
      if (selectedHour === null) {
        selectedHour = this.findLeastBusyHour(usedTimeSlots);
        if (!usedTimeSlots.has(selectedHour)) {
          usedTimeSlots.set(selectedHour, []);
        }
        usedTimeSlots.get(selectedHour)!.push(task.category || 'general');
      }
      
      const scheduledDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        selectedHour,
        0,
        0
      );
      
      scheduledTasks.push({
        ...task,
        date: scheduledDate,
      });
    }
    
    return scheduledTasks;
  }

  private findLeastBusyHour(usedTimeSlots: Map<number, string[]>): number {
    let leastBusyHour = 8;
    let minTasks = 999;
    
    for (let hour = 6; hour <= 18; hour++) {
      const taskCount = usedTimeSlots.get(hour)?.length || 0;
      if (taskCount < minTasks) {
        minTasks = taskCount;
        leastBusyHour = hour;
      }
    }
    
    return leastBusyHour;
  }

  private getWeatherForDate(weatherData: WeatherData, date: Date): Record<string, any> | null {
    try {
      const forecast = weatherData.forecast?.forecastday || [];
      for (const day of forecast) {
        const forecastDate = new Date(day.date);
        if (forecastDate.getFullYear() === date.getFullYear() && 
            forecastDate.getMonth() === date.getMonth() && 
            forecastDate.getDate() === date.getDate()) {
          return {
            temp: day.day.avgTempC,
            rain_chance: day.day.chanceOfRain,
            wind: day.day.maxWindKph,
          };
        }
      }
    } catch (error) {
      console.error('⚠️ Could not get weather for date:', error);
    }
    return null;
  }

  private sortTasksByOptimalTiming(tasks: ScheduledTask[]): ScheduledTask[] {
    return tasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 2, medium: 1, low: 0 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      const aTime = this.getOptimalStartHour(a.category);
      const bTime = this.getOptimalStartHour(b.category);
      return aTime - bTime;
    });
  }

  private getOptimalTimeRange(category: string | undefined, weather: Record<string, any> | null): number[] {
    const isHotDay = weather && weather.temp > 30;
    const isRainyDay = weather && weather.rain_chance > 60;
    
    switch (category) {
      case 'irrigation':
      case 'watering':
        return isHotDay ? [5, 6, 17, 18] : [6, 7, 17];
        
      case 'fertilization':
        return isRainyDay ? [10, 11] : [6, 7, 8, 9];
        
      case 'pest_control':
        return [5, 6, 7, 8, 18];
        
      case 'inspection':
        return [8, 9, 10, 11];
        
      case 'pruning':
        return [7, 8, 9, 10, 11];
        
      case 'harvesting':
        return [6, 7, 8, 9, 10];
        
      case 'soil_care':
        return [8, 9, 10, 11, 12, 13, 14];
        
      default:
        return [8, 9, 10, 11];
    }
  }

  private getOptimalStartHour(category: string | undefined): number {
    switch (category) {
      case 'irrigation':
      case 'watering':
      case 'pest_control':
        return 5;
      case 'harvesting':
      case 'fertilization':
        return 6;
      case 'pruning':
        return 7;
      case 'inspection':
      case 'soil_care':
      default:
        return 8;
    }
  }

  private async getAllExistingScheduledTasks(farmId: string): Promise<ScheduledTask[]> {
    try {
      const allTasks = await firebaseService.getTodayTasksList(farmId);
      const now = new Date();
      const existingTasks: ScheduledTask[] = [];

      for (const task of allTasks) {
        if (task.dueDate) {
          let dueDate: Date | null = null;
          
          if (task.dueDate instanceof Timestamp) {
            dueDate = task.dueDate.toDate();
          } else if (task.dueDate instanceof Date) {
            dueDate = task.dueDate;
          } else {
            dueDate = new Date(task.dueDate);
          }
          
          if (dueDate && dueDate > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
            existingTasks.push({
              title: task.title || 'Unknown Task',
              date: dueDate,
              priority: TaskPriority.MEDIUM,
              reason: 'existing_schedule',
              description: task.description || '',
              source: TaskSource.ROUTINE,
              scope: TaskScope.FARM_WIDE,
              targetClusters: [],
              category: this.inferCategory(
                task.title || '',
                task.description || ''
              ),
            });
          }
        }
      }

      return existingTasks;
    } catch (error) {
      console.error('❌ Error getting existing tasks:', error);
      return [];
    }
  }

  private async generateCompleteAISchedule(params: {
    weatherData: WeatherData;
    farmContext: FarmContext;
    existingTasks: ScheduledTask[];
    location: string;
  }): Promise<ScheduledTask[]> {
    try {
      const prompt = this.buildAIPrompt(params);
      const aiResponse = await this.aiService.getChatResponse(prompt, []);
      return this.parseAITasks(aiResponse);
    } catch (error) {
      console.error('❌ AI scheduling failed:', error);
      return this.generateEmergencyFallbackSchedule(params.weatherData, params.farmContext);
    }
  }

  private buildAIPrompt(params: {
    weatherData: WeatherData;
    farmContext: FarmContext;
    existingTasks: ScheduledTask[];
    location: string;
  }): string {
    const { weatherData, farmContext, existingTasks, location } = params;
    const buffer: string[] = [];
    const now = new Date();
    
    const stats = farmContext.statistics || {};
    const clusters = farmContext.clusters || [];
    const growthStage = this.determineGrowthStage(farmContext);
    
    buffer.push('🌳 MANGO FARM AI SCHEDULER - WEEKLY GENERATION');
    buffer.push('='.repeat(60));
    buffer.push('');
    
    buffer.push(`📅 CURRENT DATE: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    buffer.push('🚨 CRITICAL: Generate 12-18 tasks for the NEXT 7 DAYS');
    buffer.push('');
    
    buffer.push('🚨 EXISTING TASKS (NEVER DUPLICATE THESE):');
    if (existingTasks.length === 0) {
      buffer.push('- No existing tasks (fresh generation)');
    } else {
      const groupedByDate = new Map<string, ScheduledTask[]>();
      for (const task of existingTasks) {
        const dateKey = `${task.date.getFullYear()}-${String(task.date.getMonth() + 1).padStart(2, '0')}-${String(task.date.getDate()).padStart(2, '0')}`;
        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, []);
        }
        groupedByDate.get(dateKey)!.push(task);
      }
      
      groupedByDate.forEach((tasks, date) => {
        buffer.push(`\n${date}:`);
        tasks.forEach(task => {
          const clusters = task.targetClusters.length === 0 ? 'farm-wide' : task.targetClusters.join(',');
          buffer.push(`  ❌ DO NOT CREATE: ${task.category}/${task.title} (${clusters})`);
        });
      });
    }
    buffer.push('');
    
    buffer.push('📊 FARM HEALTH:');
    buffer.push(`- Location: ${location}`);
    buffer.push(`- Total Trees: ${stats.totalTrees || 0}`);
    buffer.push(`- Unhealthy: ${stats.unhealthyTrees || 0}`);
    buffer.push(`- Growth Stage: ${growthStage}`);
    buffer.push('');
    
    buffer.push('🌤️  WEATHER FORECAST:');
    const forecast = weatherData.forecast?.forecastday || [];
    forecast.forEach(day => {
      const date = new Date(day.date);
      buffer.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}: ${day.day.avgTempC}°C, ${day.day.totalPrecipMm}mm rain`);
    });
    buffer.push('');
    
    buffer.push('🤖 GENERATE 12-18 UNIQUE TASKS');
    buffer.push('⚠️  Distribute evenly across all 7 days');
    buffer.push('⚠️  Include variety: irrigation, inspection, fertilization, pest control, pruning');
    buffer.push('');
    buffer.push('📝 FORMAT: TITLE|YYYY-MM-DD|PRIORITY|CLUSTERS|REASON|DESCRIPTION');

    return buffer.join('\n');
  }

  private parseAITasks(aiResponse: string): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    const lines = aiResponse.split('\n');
    const currentYear = new Date().getFullYear();
    
    for (let line of lines) {
      line = line.trim();
      if (line.includes('|') && !line.toLowerCase().startsWith('title')) {
        try {
          const parts = line.split('|').map(e => e.trim());
          if (parts.length >= 6) {
            const parsedDate = new Date(parts[1]);
            const date = new Date(currentYear, parsedDate.getMonth(), parsedDate.getDate());
            
            const clusters = parts[3].toLowerCase() === 'farm_wide' 
              ? [] 
              : parts[3].split(',').map(e => e.trim()).filter(e => e.length > 0);
            
            const category = this.inferCategory(parts[0], parts[5]);
            
            tasks.push({
              title: parts[0],
              date,
              priority: this.parsePriority(parts[2]),
              reason: parts[4],
              description: parts[5],
              source: TaskSource.AI,
              scope: clusters.length === 0 ? TaskScope.FARM_WIDE : TaskScope.CLUSTER_SPECIFIC,
              targetClusters: clusters,
              category,
            });
          }
        } catch (error) {
          console.error(`❌ Parse error: ${line} - ${error}`);
        }
      }
    }

    return tasks;
  }

  private inferCategory(title: string, description: string): string {
    const lower = `${title.toLowerCase()} ${description.toLowerCase()}`;
    
    if (lower.includes('irrigat') || lower.includes('water')) return 'irrigation';
    if (lower.includes('fertiliz') || lower.includes('nutrient')) return 'fertilization';
    if (lower.includes('pest') || lower.includes('disease') || lower.includes('fungicide')) return 'pest_control';
    if (lower.includes('inspect') || lower.includes('monitor')) return 'inspection';
    if (lower.includes('prun') || lower.includes('trim')) return 'pruning';
    if (lower.includes('harvest')) return 'harvesting';
    if (lower.includes('soil')) return 'soil_care';
    
    return 'general_care';
  }

  private generateEmergencyFallbackSchedule(
    weatherData: WeatherData, 
    farmContext: FarmContext
  ): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    const forecast = weatherData.forecast?.forecastday || [];
    
    for (let i = 0; i < forecast.length; i += 2) {
      if (i < forecast.length) {
        const day = forecast[i];
        const date = new Date(day.date);
        
        tasks.push({
          title: 'Farm Inspection',
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0),
          priority: TaskPriority.MEDIUM,
          reason: 'fallback_schedule',
          description: 'Basic farm inspection due to AI service unavailability',
          source: TaskSource.ROUTINE,
          scope: TaskScope.FARM_WIDE,
          targetClusters: [],
          category: 'inspection',
        });
      }
    }
    
    return tasks;
  }

  private async getFarmContext(farmId: string): Promise<FarmContext> {
    try {
      const stats = await firebaseService.getStatistics(farmId);
      const scans = await firebaseService.getRecentScansWithDetails(farmId, { limit: 10 });
      const clusterStats: Record<string, any> = {};
      const clusters = await firebaseService.getClustersList(farmId);

      for (const cluster of clusters) {
        const stats = await firebaseService.getClusterStatistics(farmId, cluster);
        clusterStats[cluster] = stats;
      }

      return {
        statistics: stats,
        recent_scans: scans,
        cluster_stats: clusterStats,
        clusters,
      };
    } catch (error) {
      console.error('Error getting farm context:', error);
      return {};
    }
  }

  private determineGrowthStage(farmContext: FarmContext): string {
    const now = new Date();
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthKey = monthNames[now.getMonth()];
    
    return SEASONAL_CALENDAR[monthKey]?.stage || 'vegetative';
  }

private async saveScheduledTasks(farmId: string, tasks: ScheduledTask[]): Promise<void> {
  let successCount = 0;
  let failCount = 0;
  
  for (const task of tasks) {
    try {
      // Build task data object with required properties
      const taskData = {
        farmId,
        title: ScheduledTaskHelper.getDisplayTitle(task),
        dueDate: task.date,
        status: 'pending',
        description: task.description,
        type: this.getTaskTypeFromCategory(task.category),
        ...(task.targetClusters && task.targetClusters.length > 0 && {
          clusterId: task.targetClusters[0],
          clusterName: task.targetClusters[0],
        }),
      };

      await firebaseService.addTask(taskData);
      
      successCount++;
      console.log(`✅ Saved: ${task.title} at ${task.date.getHours()}:00`);
    } catch (error) {
      failCount++;
      console.error(`❌ Save failed: ${task.title} - ${error}`);
    }
  }
  
  console.log(`💾 Save summary: ${successCount} succeeded, ${failCount} failed`);
  
  if (successCount === 0 && failCount > 0) {
    throw new Error('Failed to save any tasks to database');
  }
}

  private getTaskTypeFromCategory(category: string | undefined): string {
    switch (category) {
      case 'irrigation':
      case 'watering':
        return 'watering';
      case 'fertilization':
        return 'fertilizing';
      case 'pest_control':
        return 'pestControl';
      case 'inspection':
        return 'inspection';
      case 'pruning':
        return 'pruning';
      case 'harvesting':
        return 'harvesting';
      case 'soil_care':
        return 'fertilizing';
      default:
        return 'inspection';
    }
  }

  private parsePriority(priority: string): TaskPriority {
    switch (priority.toLowerCase()) {
      case 'high':
        return TaskPriority.HIGH;
      case 'low':
        return TaskPriority.LOW;
      default:
        return TaskPriority.MEDIUM;
    }
  }
}

// ===== EXPORT FACTORY FUNCTION =====
export function createAIScheduler(
  weatherService: any,
  aiService: any,
  notificationService: any
): EnhancedAIScheduler {
  return new EnhancedAIScheduler(weatherService, aiService, notificationService);
}
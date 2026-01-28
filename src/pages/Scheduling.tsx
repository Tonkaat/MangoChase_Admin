// src/pages/Scheduling.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { format, isSameDay, addDays } from "date-fns";
import { Plus, Sparkles, RefreshCw, Filter, Search, Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleCalendar } from "@/components/scheduling/ScheduleCalendar";
import { WeatherWidget } from "@/components/scheduling/WeatherWidget";
import { ScheduleStats } from "@/components/scheduling/ScheduleStats";
import type { WeatherData } from "@/types/task.types";
import { TaskItem } from "@/components/scheduling/TaskItem";
import { TaskDetailsSheet } from "@/components/scheduling/TaskDetailsSheet";
import { AddTaskDialog } from "@/components/scheduling/AddTaskDialog";
import { AIScheduleBanner } from "@/components/scheduling/AIScheduleBanner";
import { AIGenerateDialog, AISuccessDialog } from "@/components/scheduling/AIGenerateDialog";
import { EmptySchedule } from "@/components/scheduling/EmptySchedule";
import type { Task, TaskType } from "@/types/task.types";
import { TASK_TYPE_CONFIG } from "@/types/task.types";
import { Timestamp } from "firebase/firestore";

// Services
import { taskService } from "@/services/firebase/taskService";
import { farmService } from "@/services/firebase/farmService";
import { weatherService } from "@/services/weatherService";
import { createAIScheduler } from "@/services/aiSchedulingService";
import { geminiService } from "@/services/aiService";
import { notificationService } from "@/services/notificationService";
import { useFarm } from "@/providers/farm-provider";
import { auth } from "@/services/firebase/firebaseConfig";

// Initialize AI Scheduler
const aiScheduler = createAIScheduler(
  weatherService,
  geminiService,
  notificationService
);

export default function Scheduling() {
  const { selectedFarmId, setSelectedFarmId } = useFarm();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isAISuccessOpen, setIsAISuccessOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [clusters, setClusters] = useState<any[]>([]);
  
  // AI Generation state
  const [canGenerate, setCanGenerate] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<Date | null>(null);
  const [lastTasksGenerated, setLastTasksGenerated] = useState(0);

  // Get farm details
  const [currentFarm, setCurrentFarm] = useState<any>(null);

  // Auto-load user's farm if not selected
  useEffect(() => {
    const loadUserFarm = async () => {
      if (selectedFarmId) return; // Already have a farm selected
      
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.log('No user logged in');
          setIsLoading(false);
          return;
        }

        const farms = await farmService.getUserFarms(userId);
        if (farms.length > 0) {
          // Auto-select the first (and likely only) farm
          const farmId = farms[0].farmId;
          console.log('🔄 Auto-selecting farm:', farmId);
          setSelectedFarmId(farmId);
        } else {
          console.log('⚠️ No farms found for user');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading user farm:', error);
        setIsLoading(false);
      }
    };

    loadUserFarm();
  }, [selectedFarmId, setSelectedFarmId]);

  useEffect(() => {
    if (!selectedFarmId) {
      setCurrentFarm(null);
      return;
    }

    const loadFarm = async () => {
      try {
        const farm = await farmService.getFarmProfile(selectedFarmId);
        setCurrentFarm(farm);
      } catch (error) {
        console.error('Error loading farm:', error);
      }
    };

    loadFarm();
  }, [selectedFarmId]);

  const farmId = selectedFarmId;
  const farmLocation = currentFarm?.location || "Manila, Philippines";

  // Load initial data
  useEffect(() => {
    if (!farmId) {
      setIsLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load clusters - you can add cluster service later if needed
        // For now using empty array
        setClusters([]);
        
        // Load weather
        await loadWeather();

        // Check AI generation availability
        await checkAIAvailability();
        
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load scheduling data");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [farmId, farmLocation]); // Added farmLocation dependency

  // Subscribe to tasks
  useEffect(() => {
    if (!farmId) return;

    console.log("📋 Subscribing to tasks for farm:", farmId);
    
    const unsubscribe = taskService.getTasks(farmId, (snapshot) => {
      const tasksData: Task[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to Date
        let dueDate: Date;
        if (data.dueDate instanceof Timestamp) {
          dueDate = data.dueDate.toDate();
        } else if (data.dueDate instanceof Date) {
          dueDate = data.dueDate;
        } else {
          dueDate = new Date(data.dueDate);
        }

        let completedAt: Date | undefined;
        if (data.completedAt) {
          completedAt = data.completedAt instanceof Timestamp 
            ? data.completedAt.toDate() 
            : new Date(data.completedAt);
        }

        const task: Task = {
          id: doc.id,
          farmId: data.farmId || farmId,
          title: data.title || "Untitled Task",
          description: data.description || "",
          type: data.type || "general",
          status: data.status || "pending",
          priority: data.priority || "medium",
          dueDate,
          completedAt,
          assignedTo: data.assignedTo,
          clusterId: data.clusterId,
          clusterName: data.clusterName,
          treeIds: data.treeIds,
          notes: data.notes,
          isAIGenerated: data.isAIGenerated || false,
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toDate() 
            : new Date(data.updatedAt || Date.now()),
        };
        
        tasksData.push(task);
      });

      console.log(`✅ Loaded ${tasksData.length} tasks`);
      setTasks(tasksData);
    });

    return () => {
      console.log("🔌 Unsubscribing from tasks");
      unsubscribe();
    };
  }, [farmId]);

  // Load weather data
  const loadWeather = async () => {
    try {
      setIsWeatherLoading(true);
      const weather = await weatherService.getWeatherForecast(farmLocation, 7);
      
      // Transform weather data to match WeatherData type
      const transformedWeather: WeatherData = {
        location: weather.location?.name || farmLocation,
        temperature: Math.round(weather.current?.temp_c || 0),
        condition: weather.current?.condition?.text || "Unknown",
        humidity: weather.current?.humidity || 0,
        windSpeed: Math.round(weather.current?.wind_kph || 0),
        icon: weather.current?.condition?.icon || "",
        lastUpdated: new Date(weather.current?.last_updated || Date.now()),
        forecast: (weather.forecast?.forecastday || []).map((day: any) => ({
          date: new Date(day.date),
          tempHigh: Math.round(day.day?.maxtemp_c || 0),
          tempLow: Math.round(day.day?.mintemp_c || 0),
          condition: day.day?.condition?.text || "Unknown",
          icon: day.day?.condition?.icon || "",
          precipitation: day.day?.daily_chance_of_rain || 0,
        })),
      };
      
      setWeatherData(transformedWeather);
      console.log("🌤️ Weather data loaded");
    } catch (error) {
      console.error("Weather load error:", error);
      toast.error("Could not load weather data");
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Check AI generation availability
  const checkAIAvailability = async () => {
    if (!farmId) return;
    
    try {
      const canGen = await aiScheduler.canGenerateSchedule(farmId);
      setCanGenerate(canGen);

      const lastGen = await aiScheduler.getLastGenerationTime(farmId);
      setLastGeneratedDate(lastGen);

      if (!canGen) {
        const nextDate = await aiScheduler.getNextAvailableDate(farmId);
        setNextAvailableDate(nextDate);
      }

      // Check and notify if ready
      await aiScheduler.checkAndNotifyIfReady(farmId);
      
      console.log(`🤖 AI Generation: ${canGen ? 'Available' : 'Not Available'}`);
    } catch (error) {
      console.error("Error checking AI availability:", error);
    }
  };

  // Get tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    return tasks
      .filter(task => isSameDay(new Date(task.dueDate), selectedDate))
      .filter(task => typeFilter === "all" || task.type === typeFilter)
      .filter(task => 
        !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, selectedDate, typeFilter, searchQuery]);

  // Toggle task status
  const handleToggleStatus = useCallback(async (task: Task) => {
    if (!farmId) return;
    
    try {
      const newStatus = task.status === 'done' ? 'pending' : 'done';
      await taskService.updateTaskStatus(farmId, task.id, newStatus);
      toast.success(newStatus === 'done' ? 'Task completed!' : 'Task marked as pending');
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task");
    }
  }, [farmId]);

  // Delete task
  const handleDeleteTask = useCallback(async (task: Task) => {
    if (!farmId) return;
    
    try {
      await taskService.deleteTask(farmId, task.id);
      toast.success('Task deleted');
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  }, [farmId]);

  // Add new task
  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>) => {
    if (!farmId) return;
    
    try {
      await taskService.addTask({
        farmId,
        title: taskData.title,
        dueDate: taskData.dueDate,
        assignedTo: taskData.assignedTo,
        status: taskData.status || 'pending',
        description: taskData.description,
        type: taskData.type,
        clusterId: taskData.clusterId,
        clusterName: taskData.clusterName,
      });
      
      toast.success('Task created successfully');
      setIsAddTaskOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to create task");
    }
  }, [farmId]);

  // Generate AI Schedule
  const handleGenerateAI = useCallback(async () => {
    if (!farmId) return;
    
    setIsAIDialogOpen(false);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Starting AI schedule generation...");

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const next = prev + 5;
          return next > 95 ? 95 : next;
        });
      }, 500);

      const statusUpdates = [
        "Analyzing weather forecast...",
        "Evaluating farm health...",
        "Checking seasonal requirements...",
        "Consulting AI model...",
        "Optimizing task schedule...",
        "Creating tasks...",
        "Finalizing schedule...",
      ];

      let statusIndex = 0;
      const statusInterval = setInterval(() => {
        if (statusIndex < statusUpdates.length) {
          setGenerationStatus(statusUpdates[statusIndex]);
          statusIndex++;
        }
      }, 800);

      // Get farm data
      const farmData = await farmService.getFarmProfile(farmId);

      // Generate schedule
      const generatedTasks = await aiScheduler.generateOptimizedSchedule({
        farmId,
        location: farmLocation,
        farmData,
      });

      clearInterval(progressInterval);
      clearInterval(statusInterval);
      
      setGenerationProgress(100);
      setGenerationStatus("Schedule generated successfully!");

      // Update state
      setLastTasksGenerated(generatedTasks.length);
      await checkAIAvailability();

      // Show success dialog
      setTimeout(() => {
        setIsGenerating(false);
        setIsAISuccessOpen(true);
        toast.success(`Created ${generatedTasks.length} optimized tasks!`);
      }, 500);

    } catch (error: any) {
      console.error("AI generation error:", error);
      setIsGenerating(false);
      
      if (error.message?.includes('Cannot generate')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to generate AI schedule. Please try again.");
      }
    }
  }, [farmId, farmLocation]);

  // Refresh weather
  const handleRefreshWeather = useCallback(async () => {
    try {
      weatherService.clearCache();
      await loadWeather();
      toast.success("Weather data refreshed");
    } catch (error) {
      toast.error("Failed to refresh weather");
    }
  }, [farmLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!farmId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please select a farm to view schedule</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <CalendarClock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Mango Schedule</h1>
            <p className="text-muted-foreground">
              Seb's Plans for his ehem ehem... Mango Farm
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button size="sm" onClick={() => setIsAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </header>

      {/* AI Schedule Banner */}
      <AIScheduleBanner
        canGenerate={canGenerate}
        nextAvailableDate={nextAvailableDate}
        isGenerating={isGenerating}
        onGenerate={() => setIsAIDialogOpen(true)}
        lastGeneratedDate={lastGeneratedDate}
        tasksGenerated={lastTasksGenerated}
      />

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar & Weather */}
        <div className="space-y-6">
          <ScheduleCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            tasks={tasks}
          />
          <WeatherWidget 
            weather={weatherData}
            isLoading={isWeatherLoading}
          />
        </div>

        {/* Right Column - Stats & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <ScheduleStats tasks={tasks} selectedDate={selectedDate} />

          {/* Tasks Section */}
          <div className="bg-card rounded-xl border shadow-sm">
            {/* Tasks Header */}
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-semibold">
                  Tasks for {isSameDay(selectedDate, new Date()) ? "Today" : format(selectedDate, "MMMM d")}
                  <span className="text-muted-foreground font-normal ml-2">
                    ({tasksForSelectedDate.length})
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 w-48"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TaskType | "all")}>
                    <SelectTrigger className="w-36 h-9">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="p-4">
              {tasksForSelectedDate.length === 0 ? (
                <EmptySchedule
                  selectedDate={selectedDate}
                  onAddTask={() => setIsAddTaskOpen(true)}
                  onGenerateAI={() => setIsAIDialogOpen(true)}
                  canGenerateAI={canGenerate}
                />
              ) : (
                <div className="space-y-3">
                  {tasksForSelectedDate.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleStatus={handleToggleStatus}
                      onView={(t) => {
                        setSelectedTask(t);
                        setIsDetailsOpen(true);
                      }}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs & Sheets */}
      <TaskDetailsSheet
        task={selectedTask}
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteTask}
      />

      <AddTaskDialog
        open={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        initialDate={selectedDate}
        clusters={clusters}
      />

      <AIGenerateDialog
        open={isAIDialogOpen || isGenerating}
        onClose={() => setIsAIDialogOpen(false)}
        onConfirm={handleGenerateAI}
        isGenerating={isGenerating}
        generationProgress={generationProgress}
        generationStatus={generationStatus}
      />

      <AISuccessDialog
        open={isAISuccessOpen}
        onClose={() => setIsAISuccessOpen(false)}
        tasksCreated={lastTasksGenerated}
        nextAvailableDate={nextAvailableDate || addDays(new Date(), 7)}
      />
    </div>
  );
}
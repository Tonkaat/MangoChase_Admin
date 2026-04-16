// src/pages/Scheduling.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, isSameDay, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
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
import { AddTaskDialog, type Cluster } from "@/components/scheduling/AddTaskDialog";
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

// Initialize AI Scheduler (singleton outside component — no re-creation on render)
const aiScheduler = createAIScheduler(weatherService, geminiService, notificationService);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a 3-month window [start, end] centred on `date` for the task subscription. */
function subscriptionWindow(date: Date): [Date, Date] {
  const start = startOfMonth(subDays(date, 31));
  const end = endOfMonth(addDays(date, 62));
  return [start, end];
}

function toTask(docId: string, data: any, farmId: string): Task {
  const toDate = (v: any): Date => {
    if (v instanceof Timestamp) return v.toDate();
    if (v instanceof Date) return v;
    return new Date(v);
  };

  return {
    id: docId,
    farmId: data.farmId || farmId,
    title: data.title || "Untitled Task",
    description: data.description || "",
    type: data.type || "general",
    status: data.status || "pending",
    priority: data.priority || "medium",
    dueDate: toDate(data.dueDate),
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    assignedTo: data.assignedTo,
    clusterId: data.clusterId ?? undefined,
    clusterName: data.clusterName ?? undefined,
    treeIds: data.treeIds,
    notes: data.notes || undefined,
    isAIGenerated: data.isAIGenerated || false,
    createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : new Date(),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [clusters, setClusters] = useState<Cluster[]>([]);

  // AI state
  const [canGenerate, setCanGenerate] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<Date | null>(null);
  const [lastTasksGenerated, setLastTasksGenerated] = useState(0);

  const [currentFarm, setCurrentFarm] = useState<any>(null);

  // Track the currently active subscription window so we only re-subscribe
  // when the selected month changes (not on every date click).
  const subscriptionWindowRef = useRef<[Date, Date] | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Auto-load farm ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedFarmId) return;

    const loadUserFarm = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) { setIsLoading(false); return; }

        const farms = await farmService.getUserFarms(userId);
        if (farms.length > 0) {
          setSelectedFarmId(farms[0].farmId);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading user farm:', error);
        setIsLoading(false);
      }
    };

    loadUserFarm();
  }, [selectedFarmId, setSelectedFarmId]);

  // ── Load farm profile ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedFarmId) { setCurrentFarm(null); return; }

    farmService.getFarmProfile(selectedFarmId)
      .then(setCurrentFarm)
      .catch((err) => console.error('Error loading farm:', err));
  }, [selectedFarmId]);

  const farmId = selectedFarmId;
  const farmLocation = currentFarm?.location || "Manila, Philippines";

  // ── Load clusters, weather, AI availability ────────────────────────────────

  useEffect(() => {
    if (!farmId) { setIsLoading(false); return; }

    const init = async () => {
      try {
        setIsLoading(true);

        await Promise.all([
          loadWeather(),
          checkAIAvailability(),
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load scheduling data");
      } finally {
        setIsLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, farmLocation]);

  // ── Windowed task subscription ─────────────────────────────────────────────
  //
  // Instead of subscribing to ALL tasks forever, we subscribe to a rolling
  // ±1-month window around the selected date. We only re-subscribe when the
  // window actually changes (i.e. when the user navigates to a new month),
  // not on every single date click.

  useEffect(() => {
    if (!farmId) return;

    const [newStart, newEnd] = subscriptionWindow(selectedDate);

    const [prevStart, prevEnd] = subscriptionWindowRef.current ?? [null, null];

    const windowUnchanged =
      prevStart?.getTime() === newStart.getTime() &&
      prevEnd?.getTime() === newEnd.getTime();

    if (windowUnchanged) return; // same window — no need to re-subscribe

    // Tear down previous subscription
    unsubscribeRef.current?.();

    subscriptionWindowRef.current = [newStart, newEnd];

    console.log(
      `📋 Task window: ${format(newStart, 'MMM d')} → ${format(newEnd, 'MMM d, yyyy')}`,
    );

    const unsub = taskService.getTasksInWindow(farmId, newStart, newEnd, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasksData.push(toTask(docSnap.id, docSnap.data(), farmId));
      });
      console.log(`✅ Loaded ${tasksData.length} tasks in window`);
      setTasks(tasksData);
    });

    unsubscribeRef.current = unsub;

    return () => {
      unsub();
      unsubscribeRef.current = null;
      subscriptionWindowRef.current = null;
    };
  }, [farmId, selectedDate]);

  // ── Load clusters ──────────────────────────────────────────────────────────
  // Uses a real-time stream so the cluster list updates if an admin adds/renames
  // a cluster while the scheduling page is open.

  useEffect(() => {
    if (!farmId) return;
    console.log('🔍 CLUSTER EFFECT RUNNING — farmId:', farmId);

    // Direct Firestore test — bypasses farmService entirely
    import('@/services/firebase/firebaseConfig').then(({ db, collection, getDocs }) => {
      getDocs(collection(db, 'farms', farmId, 'clusters')).then(snap => {
        console.log('🔍 RAW CLUSTER SNAP — size:', snap.size);
        snap.docs.forEach(d => console.log('  doc id:', d.id, 'data:', d.data()));
      }).catch(e => console.error('🔍 CLUSTER FETCH ERROR:', e));
    });

    const unsub = farmService.getClustersStream(farmId, (clusters) => {
      console.log('📦 Clusters from stream:', clusters);
      setClusters(clusters);
    });

    return unsub;
  }, [farmId]);

  // ── Weather ────────────────────────────────────────────────────────────────

  const loadWeather = useCallback(async () => {
    try {
      setIsWeatherLoading(true);
      const weather = await weatherService.getWeatherForecast(farmLocation, 7);

      const transformed: WeatherData = {
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

      setWeatherData(transformed);
    } catch (error) {
      console.error("Weather load error:", error);
      toast.error("Could not load weather data");
    } finally {
      setIsWeatherLoading(false);
    }
  }, [farmLocation]);

  // ── AI availability ────────────────────────────────────────────────────────

  const checkAIAvailability = useCallback(async () => {
    if (!farmId) return;
    try {
      const [canGen, lastGen] = await Promise.all([
        aiScheduler.canGenerateSchedule(farmId),
        aiScheduler.getLastGenerationTime(farmId),
      ]);

      setCanGenerate(canGen);
      setLastGeneratedDate(lastGen);

      if (!canGen) {
        const nextDate = await aiScheduler.getNextAvailableDate(farmId);
        setNextAvailableDate(nextDate);
      }

      await aiScheduler.checkAndNotifyIfReady(farmId);
    } catch (error) {
      console.error("Error checking AI availability:", error);
    }
  }, [farmId]);

  // ── Derived task list for selected date ────────────────────────────────────

  const tasksForSelectedDate = useMemo(() => {
    return tasks
      .filter((t) => isSameDay(new Date(t.dueDate), selectedDate))
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) =>
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, selectedDate, typeFilter, searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────────────

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

  /**
   * Called once per cluster from AddTaskDialog.
   * For multi-cluster selections the dialog calls this in parallel via Promise.all.
   */
  const handleAddTask = useCallback(async (
    taskData: Omit<Task, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!farmId) {
      toast.error("No farm selected. Please wait or refresh.");
      return;
    }

    await taskService.addTask({
      farmId,
      title: taskData.title,
      dueDate: taskData.dueDate,
      assignedTo: taskData.assignedTo,
      status: taskData.status || 'pending',
      description: taskData.description,
      type: taskData.type,
      clusterId: taskData.clusterId ?? null,
      clusterName: taskData.clusterName ?? null,
      notes: taskData.notes,
      priority: taskData.priority,
      isAIGenerated: false,
    });
  }, [farmId]);

  /** Wrapper shown to the dialog — shows a toast after all tasks are committed. */
  const handleAddTaskWithToast = useCallback(async (
    taskData: Omit<Task, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>,
  ) => {
    await handleAddTask(taskData);
    // Toast is fired by the dialog once all parallel calls resolve (see AddTaskDialog)
  }, [handleAddTask]);

  const handleAddTaskClose = useCallback((tasksCreated: number) => {
    setIsAddTaskOpen(false);
    if (tasksCreated > 0) {
      toast.success(
        tasksCreated === 1 ? 'Task created!' : `${tasksCreated} tasks created!`,
      );
    }
  }, []);

  // ── AI generation ──────────────────────────────────────────────────────────

  const handleGenerateAI = useCallback(async () => {
    if (!farmId) return;

    setIsAIDialogOpen(false);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Starting AI schedule generation...");

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 5, 95));
      }, 500);

      const statusUpdates = [
        "Analysing weather forecast...",
        "Evaluating farm health...",
        "Checking seasonal requirements...",
        "Consulting AI model...",
        "Optimising task schedule...",
        "Creating tasks...",
        "Finalising schedule...",
      ];
      let si = 0;
      const statusInterval = setInterval(() => {
        if (si < statusUpdates.length) setGenerationStatus(statusUpdates[si++]);
      }, 800);

      const farmData = await farmService.getFarmProfile(farmId);
      const generatedTasks = await aiScheduler.generateOptimizedSchedule({
        farmId,
        location: farmLocation,
        farmData,
      });

      clearInterval(progressInterval);
      clearInterval(statusInterval);
      setGenerationProgress(100);
      setGenerationStatus("Schedule generated successfully!");
      setLastTasksGenerated(generatedTasks.length);
      await checkAIAvailability();

      setTimeout(() => {
        setIsGenerating(false);
        setIsAISuccessOpen(true);
        toast.success(`Created ${generatedTasks.length} optimised tasks!`);
      }, 500);
    } catch (error: any) {
      console.error("AI generation error:", error);
      setIsGenerating(false);
      toast.error(
        error.message?.includes('Cannot generate')
          ? error.message
          : "Failed to generate AI schedule. Please try again.",
      );
    }
  }, [farmId, farmLocation, checkAIAvailability]);

  const handleRefreshWeather = useCallback(async () => {
    weatherService.clearCache?.();
    await loadWeather();
    toast.success("Weather data refreshed");
  }, [loadWeather]);

  // ── Render ─────────────────────────────────────────────────────────────────

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
        <p className="text-muted-foreground">Please select a farm to view schedule</p>
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

      {/* AI Banner */}
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
        <div className="space-y-6">
          <ScheduleCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            tasks={tasks}
          />
          <WeatherWidget weather={weatherData} isLoading={isWeatherLoading} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ScheduleStats tasks={tasks} selectedDate={selectedDate} />

          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-semibold">
                  Tasks for{" "}
                  {isSameDay(selectedDate, new Date())
                    ? "Today"
                    : format(selectedDate, "MMMM d")}
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
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => setTypeFilter(v as TaskType | "all")}
                  >
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
                  {tasksForSelectedDate.map((task) => (
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

      {/* Dialogs */}
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
        onAddTask={handleAddTaskWithToast}
        initialDate={selectedDate}
        clusters={clusters}
        onTasksCreated={handleAddTaskClose}
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
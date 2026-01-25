import { useState, useCallback, useMemo } from "react";
import { format, isSameDay, addDays } from "date-fns";
import { Plus, Sparkles, RefreshCw, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { TaskItem } from "@/components/scheduling/TaskItem";
import { TaskDetailsSheet } from "@/components/scheduling/TaskDetailsSheet";
import { AddTaskDialog } from "@/components/scheduling/AddTaskDialog";
import { AIScheduleBanner } from "@/components/scheduling/AIScheduleBanner";
import { AIGenerateDialog, AISuccessDialog } from "@/components/scheduling/AIGenerateDialog";
import { EmptySchedule } from "@/components/scheduling/EmptySchedule";
import type { Task, TaskType, WeatherData } from "@/types/task.types";
import { TASK_TYPE_CONFIG } from "@/types/task.types";

// Demo data - replace with actual Firebase integration
const generateDemoTasks = (): Task[] => {
  const today = new Date();
  return [
    {
      id: "1",
      farmId: "farm-1",
      title: "Morning Irrigation Check",
      description: "Check all irrigation systems in Block A and B for proper water flow",
      type: "watering",
      status: "pending",
      priority: "high",
      dueDate: new Date(today.setHours(8, 0, 0, 0)),
      clusterName: "Block A",
      isAIGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      farmId: "farm-1",
      title: "Fertilizer Application",
      description: "Apply NPK fertilizer to young trees in Cluster 3",
      type: "fertilizing",
      status: "pending",
      priority: "medium",
      dueDate: new Date(new Date().setHours(10, 30, 0, 0)),
      clusterName: "Cluster 3",
      isAIGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      farmId: "farm-1",
      title: "Pest Inspection",
      description: "Check for signs of mango hopper and fruit fly in mature trees",
      type: "inspection",
      status: "done",
      priority: "medium",
      dueDate: new Date(new Date().setHours(14, 0, 0, 0)),
      completedAt: new Date(),
      clusterName: "Block B",
      isAIGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      farmId: "farm-1",
      title: "Prune Dead Branches",
      description: "Remove dead and diseased branches from flagged trees",
      type: "pruning",
      status: "pending",
      priority: "low",
      dueDate: addDays(new Date(), 1),
      clusterName: "Sector 2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      farmId: "farm-1",
      title: "Spray Pesticide",
      description: "Apply organic pesticide to prevent aphid infestation",
      type: "pestControl",
      status: "pending",
      priority: "urgent",
      dueDate: addDays(new Date(), 2),
      isAIGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      farmId: "farm-1",
      title: "Harvest Ripe Mangoes",
      description: "Collect mature mangoes from early fruiting trees",
      type: "harvesting",
      status: "pending",
      priority: "high",
      dueDate: addDays(new Date(), 3),
      clusterName: "Block A",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};

const demoWeather: WeatherData = {
  location: "Manila, Philippines",
  temperature: 32,
  condition: "Partly Cloudy",
  humidity: 75,
  windSpeed: 12,
  icon: "partly-cloudy",
  lastUpdated: new Date(),
  forecast: [
    { date: new Date(), tempHigh: 33, tempLow: 26, condition: "Partly Cloudy", icon: "cloudy-sun", precipitation: 20 },
    { date: addDays(new Date(), 1), tempHigh: 31, tempLow: 25, condition: "Rainy", icon: "rain", precipitation: 80 },
    { date: addDays(new Date(), 2), tempHigh: 30, tempLow: 24, condition: "Thunderstorm", icon: "storm", precipitation: 90 },
    { date: addDays(new Date(), 3), tempHigh: 32, tempLow: 25, condition: "Cloudy", icon: "cloudy", precipitation: 40 },
    { date: addDays(new Date(), 4), tempHigh: 34, tempLow: 26, condition: "Sunny", icon: "sunny", precipitation: 10 },
    { date: addDays(new Date(), 5), tempHigh: 33, tempLow: 26, condition: "Partly Cloudy", icon: "cloudy-sun", precipitation: 25 },
    { date: addDays(new Date(), 6), tempHigh: 32, tempLow: 25, condition: "Sunny", icon: "sunny", precipitation: 5 },
  ],
};

const demoClusters = [
  { id: "1", name: "Block A" },
  { id: "2", name: "Block B" },
  { id: "3", name: "Cluster 3" },
  { id: "4", name: "Sector 2" },
];

export default function Scheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>(generateDemoTasks);
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
  
  // AI Generation state
  const [canGenerate, setCanGenerate] = useState(true);
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<Date | null>(null);
  const [lastTasksGenerated, setLastTasksGenerated] = useState(0);

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
  const handleToggleStatus = useCallback((task: Task) => {
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        const newStatus = t.status === 'done' ? 'pending' : 'done';
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'done' ? new Date() : undefined,
          updatedAt: new Date(),
        };
      }
      return t;
    }));
    toast.success(task.status === 'done' ? 'Task marked as pending' : 'Task completed!');
  }, []);

  // Delete task
  const handleDeleteTask = useCallback((task: Task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    toast.success('Task deleted');
  }, []);

  // Add new task
  const handleAddTask = useCallback((taskData: Omit<Task, 'id' | 'farmId' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      farmId: "farm-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
    toast.success('Task created successfully');
  }, []);

  // Generate AI Schedule
  const handleGenerateAI = useCallback(async () => {
    setIsAIDialogOpen(false);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Analyzing weather data...");

    // Simulate AI generation process
    const steps = [
      { progress: 15, status: "Analyzing weather data..." },
      { progress: 30, status: "Evaluating farm health..." },
      { progress: 50, status: "Checking seasonal requirements..." },
      { progress: 70, status: "Optimizing task schedule..." },
      { progress: 85, status: "Creating tasks..." },
      { progress: 100, status: "Finalizing schedule..." },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setGenerationProgress(step.progress);
      setGenerationStatus(step.status);
    }

    // Generate mock AI tasks
    const aiTasks: Task[] = [
      {
        id: `ai-${Date.now()}-1`,
        farmId: "farm-1",
        title: "Weather-based Irrigation Adjustment",
        description: "Reduce irrigation due to expected rainfall tomorrow",
        type: "watering",
        status: "pending",
        priority: "high",
        dueDate: new Date(),
        isAIGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `ai-${Date.now()}-2`,
        farmId: "farm-1",
        title: "Pre-storm Harvest",
        description: "Harvest mature fruits before the thunderstorm arrives",
        type: "harvesting",
        status: "pending",
        priority: "urgent",
        dueDate: addDays(new Date(), 1),
        clusterName: "Block A",
        isAIGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `ai-${Date.now()}-3`,
        farmId: "farm-1",
        title: "Post-rain Fungicide Application",
        description: "Apply fungicide to prevent fungal growth after heavy rain",
        type: "pestControl",
        status: "pending",
        priority: "high",
        dueDate: addDays(new Date(), 3),
        isAIGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTasks(prev => [...prev, ...aiTasks]);
    setIsGenerating(false);
    setCanGenerate(false);
    setNextAvailableDate(addDays(new Date(), 7));
    setLastGeneratedDate(new Date());
    setLastTasksGenerated(aiTasks.length);
    setIsAISuccessOpen(true);
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Smart Schedule</h1>
          <p className="text-muted-foreground">Plan and manage your farm tasks efficiently.</p>
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
          <WeatherWidget weather={demoWeather} />
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
        clusters={demoClusters}
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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserActivity } from '@/types/user.types';
import {
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserActivityLogProps {
  activities: UserActivity[];
  loading: boolean;
}

const actionConfig = {
  login: { icon: LogIn, color: 'bg-secondary/20 text-secondary', label: 'Login' },
  logout: { icon: LogOut, color: 'bg-muted text-muted-foreground', label: 'Logout' },
  create: { icon: Plus, color: 'bg-primary/20 text-primary', label: 'Create' },
  update: { icon: Edit, color: 'bg-orange-100 text-orange-600', label: 'Update' },
  delete: { icon: Trash2, color: 'bg-destructive/20 text-destructive', label: 'Delete' },
  view: { icon: Eye, color: 'bg-accent text-accent-foreground', label: 'View' },
  export: { icon: Download, color: 'bg-blue-100 text-blue-600', label: 'Export' },
} as const;

// Helper to safely get action config
const getActionConfig = (action: string) => {
  const defaultConfig = { icon: Activity, color: 'bg-muted text-muted-foreground', label: 'Activity' };
  const config = actionConfig[action as keyof typeof actionConfig];
  return config || defaultConfig;
};

export function UserActivityLog({ activities, loading }: UserActivityLogProps) {
  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">User Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Activity className="mb-2 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No activity recorded</p>
              </div>
            ) : (
              activities.map((activity) => {
                const config = getActionConfig(activity.action);
                const Icon = config.icon;
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className={`rounded-lg p-2 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{activity.userName || 'Unknown User'}</span>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.action === 'login' || activity.action === 'logout'
                          ? `${activity.action === 'login' ? 'Logged in' : 'Logged out'}`
                          : `${config.label}d ${activity.resource || 'resource'}`}
                        {activity.details && ` - ${activity.details}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Package,
  TrendingUp,
  Settings,
  AtSign,
  ExternalLink,
} from 'lucide-react';
import type { NotificationType, NotificationPriority } from '@/types/notification.types';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; label: string }> = {
  disease_alert: { icon: AlertTriangle, color: 'text-destructive', label: 'Disease Alert' },
  task_reminder: { icon: Calendar, color: 'text-primary', label: 'Task Reminder' },
  verification_update: { icon: ShieldCheck, color: 'text-green-600', label: 'Verification' },
  trade_listing: { icon: Package, color: 'text-secondary', label: 'Trade Listing' },
  market_price: { icon: TrendingUp, color: 'text-blue-600', label: 'Market Price' },
  system: { icon: Settings, color: 'text-muted-foreground', label: 'System' },
  mention: { icon: AtSign, color: 'text-purple-600', label: 'Mention' },
};

const priorityConfig: Record<NotificationPriority, { color: string; bgColor: string }> = {
  low: { color: 'text-muted-foreground', bgColor: 'bg-muted' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
  urgent: { color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export default function Notifications() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { loading, notifications, stats, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (typeFilter !== 'all') {
      result = result.filter((n) => n.type === typeFilter);
    }

    if (readFilter === 'unread') {
      result = result.filter((n) => !n.isRead);
    } else if (readFilter === 'read') {
      result = result.filter((n) => n.isRead);
    }

    return result;
  }, [notifications, typeFilter, readFilter]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    toast.success('Marked as read');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('All notifications marked as read');
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    toast.success('Notification deleted');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {stats.unread > 0 ? `${stats.unread} unread` : 'All caught up!'}
              {stats.urgent > 0 && (
                <span className="text-destructive"> • {stats.urgent} urgent</span>
              )}
            </p>
          </div>
        </div>

        {stats.unread > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NotificationType | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="disease_alert">Disease Alerts</SelectItem>
            <SelectItem value="task_reminder">Task Reminders</SelectItem>
            <SelectItem value="verification_update">Verification</SelectItem>
            <SelectItem value="trade_listing">Trade Listings</SelectItem>
            <SelectItem value="market_price">Market Prices</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="mention">Mentions</SelectItem>
          </SelectContent>
        </Select>

        <Select value={readFilter} onValueChange={(v) => setReadFilter(v as 'all' | 'unread' | 'read')}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              {typeFilter !== 'all' || readFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You're all caught up!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const config = typeConfig[notification.type];
            const priority = priorityConfig[notification.priority];
            const Icon = config.icon;

            return (
              <Card
                key={notification.id}
                className={`shadow-soft transition-all ${!notification.isRead ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`rounded-lg p-2.5 ${priority.bgColor} shrink-0`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            {notification.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {notification.actionUrl && (
                              <Link
                                to={notification.actionUrl}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                {notification.actionLabel || 'View'}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.isRead && (
                              <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark as read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(notification.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

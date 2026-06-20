// src/components/layout/Header.tsx
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Bell, Search, UserRound, LogOut, CheckCheck, AlertTriangle, Calendar, ShieldCheck, Package, TrendingUp, Settings, AtSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Link } from "react-router-dom";

const typeConfig = {
  disease_alert: { icon: AlertTriangle, color: 'text-destructive' },
  task_reminder: { icon: Calendar, color: 'text-primary' },
  verification_update: { icon: ShieldCheck, color: 'text-green-600' },
  trade_listing: { icon: Package, color: 'text-secondary' },
  market_price: { icon: TrendingUp, color: 'text-blue-600' },
  system: { icon: Settings, color: 'text-muted-foreground' },
  mention: { icon: AtSign, color: 'text-purple-600' },
};

export function Header() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { loading, notifications, stats, markAsRead, markAllAsRead } = useNotifications();
  
  // Filter to show only unread or limit to 5 most recent
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = stats.unread || 0;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const initials = userProfile?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-3 px-4">
        <SidebarTrigger className="shrink-0" />
        <BrandLogo className="scale-[0.95] md:hidden" />
        {/* <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search farms, trees, tasks…"
            className="h-10 rounded-full pl-9"
            aria-label="Search"
          />
        </div> */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 relative" 
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[80vh] overflow-y-auto">
              <DropdownMenuLabel className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    className="h-auto p-0 text-xs gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {loading ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Loading notifications...</div>
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <>
                  {recentNotifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config?.icon || Bell;
                    const isUnread = !notification.isRead;
                    
                    return (
                      <DropdownMenuItem 
                        key={notification.id} 
                        className="flex flex-col items-start gap-1 py-3 cursor-default hover:bg-accent/50"
                        onClick={() => {
                          if (isUnread) {
                            handleMarkAsRead(notification.id);
                          }
                          if (notification.actionUrl) {
                            navigate(notification.actionUrl);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className={`shrink-0 rounded-lg p-2 ${isUnread ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${config?.color || 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium truncate ${isUnread ? '' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                              {notification.priority === 'urgent' && (
                                <Badge variant="destructive" className="h-4 px-1 text-[10px] shrink-0">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                              </span>
                              {notification.actionUrl && (
                                <span className="text-xs text-primary">
                                  {notification.actionLabel || 'View'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  
                  <DropdownMenuSeparator />
                  
                  {/* See More Link */}
                  <DropdownMenuItem asChild className="text-center justify-center py-2 hover:bg-transparent">
                    <Link 
                      to="/notifications" 
                      className="w-full text-sm text-primary hover:underline font-medium"
                    >
                      See all notifications
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <UserRound className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
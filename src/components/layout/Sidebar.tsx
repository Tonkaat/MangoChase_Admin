import { NavLink } from "@/components/NavLink";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Settings,
  Sprout,
  Trees,
  Users,
  CalendarClock,
  MessageSquareMore,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const nav = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Trees", to: "/trees", icon: Trees },
  { title: "Farmer's Board", to: "/board", icon: MessageSquareMore },
  { title: "Users", to: "/users", icon: Users },
  { title: "Scheduling", to: "/scheduling", icon: CalendarClock },
  { title: "Analytics", to: "/analytics", icon: BarChart3 },
  { title: "Journal", to: "/journal", icon: BookOpen },
  { title: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <ShadSidebar collapsible="icon" variant="inset">
      {/* Fixed height header - same in both states */}
      <SidebarHeader className={cn(
        "border-b",
        "h-14", // Fixed height instead of auto
        collapsed ? "px-1" : "px-2"
      )}>
        <div className={cn(
          "flex h-full items-center",
          collapsed ? "justify-center" : ""
        )}>
          <BrandLogo collapsed={collapsed} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.to}
                        end
                        className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                        {active && !collapsed && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Fixed height footer - same in both states */}
      <SidebarFooter className={cn(
        "border-t",
        "h-16" // Fixed height
      )}>
        <div className={cn(
          "flex h-full items-center",
          collapsed ? "justify-center" : "px-3"
        )}>
          <div className={cn(
            "grid place-items-center rounded-lg bg-accent text-accent-foreground",
            collapsed ? "h-9 w-9" : "h-9 w-9"
          )}>
            <Sprout className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="ml-2 min-w-0 transition-opacity duration-200">
              <div className="text-sm font-semibold">Mango Chase</div>
              <div className="text-xs text-muted-foreground">Version 0.8</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </ShadSidebar>
  );
}
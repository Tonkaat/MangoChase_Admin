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
  Leaf,
  LayoutDashboard,
  Settings,
  Sprout,
  Trees,
  Users,
  CalendarClock,
  MessageSquareMore,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const nav = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Farmer's Board", to: "/board", icon: MessageSquareMore },
  // { title: "Farms", to: "/farms", icon: Leaf },
  { title: "Trees", to: "/trees", icon: Trees },
  { title: "Users", to: "/users", icon: Users },
  { title: "Scheduling", to: "/scheduling", icon: CalendarClock },
  { title: "Analytics", to: "/analytics", icon: BarChart3 },
  // { title: "Knowledge", to: "/knowledge", icon: BookOpen },
  { title: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <ShadSidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b overflow-hidden">
        <div 
          className="flex items-center px-2 transition-all duration-300 ease-in-out"
          style={{
            height: collapsed ? '0px' : '64px',
            opacity: collapsed ? 0 : 1,
            transform: collapsed ? 'translateY(-8px)' : 'translateY(0)',
          }}
        >
          <BrandLogo />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup 
          className="transition-all duration-300 ease-in-out"
          style={{
            transform: collapsed ? 'translateY(0)' : 'translateY(0)',
            marginTop: collapsed ? '0' : '0'
          }}
        >
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink
                        to={item.to}
                        end
                        className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate font-medium">{item.title}</span>}
                        {active && !collapsed && (
                          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
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

      <SidebarFooter className="border-t">
        <div className={`flex items-center gap-2 px-3 py-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Sprout className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <div className="truncate text-sm font-semibold">Time</div>
              <div className="truncate text-xs text-muted-foreground">Date</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </ShadSidebar>
  );
}
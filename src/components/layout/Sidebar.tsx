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
  Bell,
} from "lucide-react";
import { useLocation } from "react-router-dom";

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
      <SidebarHeader className="border-b">
        <div className="px-2 py-2">
          <BrandLogo className={collapsed ? "justify-center" : ""} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.to}
                        end
                        className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                      >
                        <Icon className="h-4 w-4" />
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

      <SidebarFooter className="border-t">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Sprout className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold">Healthy harvests</div>
              <div className="text-xs text-muted-foreground">Mango-ready insights</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </ShadSidebar>
  );
}

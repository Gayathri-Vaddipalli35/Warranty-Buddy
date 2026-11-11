import { Link, Outlet, useNavigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Package, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
] as const;

function NavItems() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenu>
      {NAV.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)} className="h-10 font-semibold">
            <Link to={item.to} onClick={() => setOpenMobile(false)}>
              <item.icon /> {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppShell() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const name = (user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? "You";
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-5">
          <Link to="/dashboard"><Logo /></Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavItems />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <Button asChild className="w-full">
            <Link to="/products/new"><Plus /> Add product</Link>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <SidebarTrigger aria-label="Open menu" />
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary-soft text-sm font-bold text-primary-deep">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

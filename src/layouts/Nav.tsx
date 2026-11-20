import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, Activity, Trophy, GraduationCap, UserSearch, Bell, Settings, Plus, ClipboardList, Users, UserCheck,
} from "lucide-react";
import { Link } from "@/router-compat";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import { useRepHeader } from "@/lib/repSettingsApi";
import { CountBadge } from "@/components/shell";
import { cn } from "@/lib/utils";

export const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "My Profile", icon: User },
  { to: "/performance", label: "Performance", icon: Activity },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/training-plans", label: "Training Plans", icon: ClipboardList },
  { to: "/scholarships", label: "Scholarships", icon: GraduationCap },
  { to: "/recruiting", label: "Recruiting", icon: UserSearch },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const tabs = [nav[0], nav[2], nav[3], nav[1]] as const;

/** The School Representative's own pages (the athlete tabs above do not apply to them). */
export const repNav = [
  { to: "/rep/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rep/coaches", label: "My Coaches", icon: Users },
  { to: "/rep/requests", label: "Coach Requests", icon: UserCheck },
  { to: "/rep/athletes", label: "My Athletes", icon: Trophy },
  { to: "/scholarships", label: "Scholarships", icon: GraduationCap },
] as const;


function useIsActive() {
  const { pathname } = useLocation();
  return (to: string) => pathname === to || pathname.startsWith(to + "/");
}

/** Phone tab bar: Dashboard, Performance, a big Practice button, Rankings, Profile. */
export function BottomNav() {
  const { user } = useAuth();
  if (user && primaryRole(user.roles) === "university_representative") return <RepBottomNav />;
  return <AthleteBottomNav />;
}

const SHORT_LABEL: Record<string, string> = { "/rep/requests": "Requests" };

/** Phone tab bar for a school representative: Dashboard, Coaches, Requests, Athletes, Scholarships (the bell stays in the top bar). */
function RepBottomNav() {
  const isActive = useIsActive();
  const { user } = useAuth();
  const header = useRepHeader(user?.id);
  const items = repNav;
  return (
    <nav aria-label="Mobile" className="border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid grid-cols-5 items-end">
        {items.map((item) => (
          <TabItem key={item.to} {...item} label={SHORT_LABEL[item.to] ?? item.label} active={isActive(item.to)} badge={item.to === "/rep/requests" ? header?.pendingCoachRequests ?? 0 : 0} />
        ))}
      </div>
    </nav>
  );
}

function AthleteBottomNav() {
  const isActive = useIsActive();
  const { user } = useAuth();
  const home = user ? homePathFor(user.roles) : "/dashboard";
  const { pathname } = useLocation();
  return (
    <nav aria-label="Mobile" className="border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid grid-cols-5 items-end">
        {tabs.slice(0, 2).map((item) => {
          const to = item.to === "/dashboard" ? home : item.to; // coaches: their own dashboard
          return <TabItem key={item.to} {...item} to={to} active={isActive(to) && pathname !== "/performance/new"} />;
        })}
        <Link to="/performance/new" aria-label="Start new practice" className="-mt-6 flex flex-col items-center pb-2">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-electric-gradient text-primary-foreground shadow-glow"><Plus className="h-7 w-7" /></span>
          <span className="mt-1 text-[11px] font-semibold text-primary">Practice</span>
        </Link>
        {tabs.slice(2).map((item) => (
          <TabItem key={item.to} {...item} active={isActive(item.to)} />
        ))}
      </div>
    </nav>
  );
}

function TabItem({ to, label, icon: Icon, active, badge }: { to: string; label: string; icon: typeof User; active: boolean; badge?: number }) {
  return (
    <Link to={to} direction="root" className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground", active && "text-primary")}>
      <span className="relative">
        <Icon className="h-6 w-6" />
        {badge ? <CountBadge count={badge} className="absolute -right-3 -top-1.5 ml-0 h-4 min-w-4 text-[10px]" /> : null}
      </span>
      {label.replace("My ", "")}
    </Link>
  );
}

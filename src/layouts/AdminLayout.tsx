import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { IonContent, IonPage } from "@ionic/react";
import { toast } from "sonner";
import {
  Activity, Bell, ClipboardCheck, Flag, GraduationCap, ShieldAlert, LayoutDashboard, LogOut, Settings, Users, type LucideIcon,
} from "lucide-react";
import { Link } from "@/router-compat";
import { useAuth } from "@/auth/AuthContext";
import { useAdminHeader } from "@/lib/useAdminHeader";
import type { AdminHeader } from "@/lib/adminApi";
import {
  DropdownDivider, DropdownLabel, DropdownPanel, HeaderBrand, HeaderNavItem, HeaderPill, HeaderPillDivider,
  HeaderUser, MenuGlyph, dropdownItemClass, useDropdown,
} from "@/components/shell";

export const ADMIN_HOME = "/admin/dashboard";
export const ADMIN_USERS = "/admin/users";
export const ADMIN_VERIFICATIONS = "/admin/verifications";
export const ADMIN_MONITORING = "/admin/monitoring";
export const ADMIN_SETTINGS = "/admin/settings";

/**
 * Administrator shell. Same top bar as the Student-Athlete and Coach shells (components/shell.tsx):
 * brand, underlined tabs, notification bell and the profile pill. Below 1360px the tabs move into the
 * profile dropdown, as they do on phones for the other roles.
 *
 * Every tab is a real page.
 * (on purpose), so they say "coming soon" instead of linking to a page that does not exist.
 */
interface NavEntry {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const NAV: NavEntry[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: ADMIN_HOME },
  { label: "User Management", icon: Users, to: ADMIN_USERS },
  { label: "School Verification", icon: GraduationCap, to: ADMIN_VERIFICATIONS },
  { label: "Platform Monitoring", icon: Activity, to: ADMIN_MONITORING },
  { label: "Settings", icon: Settings, to: ADMIN_SETTINGS },
];

const comingSoon = (label: string) => toast(`${label} is coming soon`, { description: "This admin page hasn't been built yet." });

/* ---------------------------------------------------------------- top bar menus */

function NotificationsMenu({ header, refresh }: { header: AdminHeader | null; refresh: () => void }) {
  const { open, setOpen, ref } = useDropdown();
  // What is counted here is decided in Settings > Notification Preferences; a switched-off kind arrives as null.
  const b = header?.bell;
  const apps = b?.applications ?? 0;
  const reports = b?.reports ?? 0;
  const alerts = b?.securityAlerts ?? 0;
  const week = b?.registrations ?? 0;
  const badge = apps + reports + alerts;
  const allOff = !!b && b.applications === null && b.reports === null && b.securityAlerts === null && b.registrations === null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { if (!open) refresh(); setOpen((v) => !v); }}
        aria-label={badge > 0 ? `Notifications, ${badge} waiting` : "Notifications"}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-shell-icon transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus"
      >
        <Bell className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sky-400 px-1 text-[11px] font-bold text-[#0a1f44] ring-2 ring-[#0f3160]">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      {open && (
        <DropdownPanel className="w-[min(20rem,calc(100vw-2rem))]">
          <DropdownLabel>Notifications</DropdownLabel>
          {apps > 0 && (
            <Link to={ADMIN_VERIFICATIONS} direction="root" role="menuitem" className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-600"><ClipboardCheck className="h-4 w-4" /></span>
              <span>
                <span className="block font-semibold">{apps} application{apps === 1 ? "" : "s"} waiting</span>
                <span className="block text-xs text-muted-foreground">School representatives are waiting for you to review their application.</span>
              </span>
            </Link>
          )}
          {reports > 0 && (
            <Link to={ADMIN_MONITORING} direction="root" role="menuitem" className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-600"><Flag className="h-4 w-4" /></span>
              <span>
                <span className="block font-semibold">{reports} report{reports === 1 ? "" : "s"} waiting</span>
                <span className="block text-xs text-muted-foreground">Reported content is waiting for a first look.</span>
              </span>
            </Link>
          )}
          {alerts > 0 && (
            <Link to={ADMIN_MONITORING} direction="root" role="menuitem" className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600"><ShieldAlert className="h-4 w-4" /></span>
              <span>
                <span className="block font-semibold">{alerts} failed admin sign-in{alerts === 1 ? "" : "s"}</span>
                <span className="block text-xs text-muted-foreground">In the last 24 hours. Check the Security activity log.</span>
              </span>
            </Link>
          )}
          {badge === 0 && !allOff && <p className="px-3 py-2.5 text-sm text-muted-foreground">You're all caught up.</p>}
          {allOff && <p className="px-3 py-2.5 text-sm text-muted-foreground">All notifications are switched off.</p>}
          {week > 0 && <p className="px-3 py-2 text-xs text-muted-foreground">{week} new account{week === 1 ? "" : "s"} in the last 7 days.</p>}
          <DropdownDivider />
          <Link to={`${ADMIN_SETTINGS}#notifications`} direction="root" role="menuitem" className={dropdownItemClass()}>
            <Settings className="h-4 w-4" /> Notification settings
          </Link>
        </DropdownPanel>
      )}
    </div>
  );
}

function ProfileMenu({ isActive, header }: { isActive: (to?: string) => boolean; header: AdminHeader | null }) {
  const { open, setOpen, ref } = useDropdown();
  const { user, signOut } = useAuth();
  const name = header?.displayName?.trim() || user?.displayName?.trim() || "Administrator";
  return (
    <div ref={ref} className="relative">
      <HeaderPill>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Administrator menu"
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus"
        >
          <HeaderUser name={name} shortName={/^sportal administrator$/i.test(name) ? "Admin" : (name.split(/\s+/)[0] ?? name)} {...(header?.avatar ? { src: header.avatar } : {})} />
          <HeaderPillDivider />
          <MenuGlyph open={open} />
        </button>
      </HeaderPill>
      {open && (
        <DropdownPanel>
          <div className="px-3 pb-2 pt-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">Administrator</span>
          </div>
          <DropdownDivider />
          {/* below 1360px the tabs do not fit in the bar, so they live here */}
          <div className="min-[1360px]:hidden">
            {NAV.map((item) =>
              item.to ? (
                <Link key={item.label} to={item.to} direction="root" role="menuitem" aria-current={isActive(item.to) ? "page" : undefined} className={dropdownItemClass(isActive(item.to))}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ) : (
                <button key={item.label} type="button" role="menuitem" className={dropdownItemClass()} onClick={() => { setOpen(false); comingSoon(item.label); }}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ),
            )}
            <DropdownDivider />
          </div>
          <button type="button" role="menuitem" className={dropdownItemClass()} onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the shell */

export function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { pathname } = useLocation();
  const { header, refresh } = useAdminHeader();
  const isActive = (to?: string) => !!to && (pathname === to || pathname.startsWith(to + "/"));

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="min-h-full bg-[#f3f6fb] text-foreground">
          <header className="sticky top-0 z-40 border-b-2 border-sky-400/60 bg-shell pt-[var(--ion-safe-area-top,0px)] text-shell-fg shadow-sm">
            <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 sm:px-6 md:h-16 md:gap-4 lg:px-8">
              <HeaderBrand to={ADMIN_HOME} label="Sportal admin home" />

              <nav aria-label="Administration" className="ml-2 hidden items-center min-[1360px]:flex">
                {NAV.map((item) => (
                  <HeaderNavItem
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    to={item.to}
                    active={isActive(item.to)}
                    onClick={item.to ? undefined : () => comingSoon(item.label)}
                  />
                ))}
              </nav>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <NotificationsMenu header={header} refresh={refresh} />
                <ProfileMenu isActive={isActive} header={header} />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            {/* the active tab already says where you are; screen readers still get the page name */}
            <h1 className="sr-only">{title ?? NAV.find((n) => isActive(n.to))?.label ?? "Administration"}</h1>
            {children}
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}

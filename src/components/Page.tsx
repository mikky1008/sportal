import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { IonContent, IonFooter, IonPage } from "@ionic/react";
import { Bell, LogOut, Settings } from "lucide-react";
import { useUnreadCount } from "@/lib/notificationsApi";
import { useAthleteProfile } from "@/lib/profileStore";
import { Link } from "@/router-compat";
import { BottomNav, nav, repNav } from "@/layouts/Nav";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import { useRepHeader } from "@/lib/repSettingsApi";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { cn } from "@/lib/utils";
import {
  AppHeader, CountBadge, DropdownDivider, DropdownPanel, HeaderBack, HeaderBrand, HeaderNavItem, HeaderPill, HeaderPillDivider,
  HeaderSearch, HeaderUser, MenuGlyph, NotificationBell, PageBody, dropdownItemClass, useDropdown,
} from "@/components/shell";
import juan from "@/assets/juan.jpg";

interface PageProps {
  title?: string;
  children: ReactNode;
  /** false for sign in / sign up / profile setup: full-screen, no top bar or tab bar */
  shell?: boolean;
  /** show a back arrow (to this path when there is no history) */
  backTo?: string;
  /** hide the bottom tab bar on this screen (e.g. while recording a practice) */
  hideTabs?: boolean;
}

/** The few links that stay visible in the top bar. Everything else lives in the Menu dropdown. */
const TOP_TABS = ["/dashboard", "/performance", "/rankings"];
const MENU_ITEMS = ["/profile", "/training-plans", "/scholarships", "/recruiting", "/settings"];

/** Every screen is one of these: an Ionic page with a top navigation bar, scrolling content and (on phones) a tab bar. */
export function Page({ children, shell = true, backTo, hideTabs }: PageProps) {
  const desktop = useIsDesktop();
  const { user } = useAuth();
  const isRep = !!user && primaryRole(user.roles) === "university_representative";
  if (!shell) {
    return (
      <IonPage>
        <IonContent fullscreen>{children}</IonContent>
      </IonPage>
    );
  }
  return (
    <IonPage>
      <IonContent fullscreen>
        {isRep ? <RepTopBar backTo={backTo} /> : <TopBar backTo={backTo} />}
        <PageBody>{children}</PageBody>
      </IonContent>
      {!desktop && !hideTabs && (
        <IonFooter>
          <BottomNav />
        </IonFooter>
      )}
    </IonPage>
  );
}

/** Top navigation: logo, main tabs (tablet and up), search, notifications, and your profile with a settings dropdown. */
function TopBar({ backTo }: { backTo?: string }) {
  const athlete = useAthleteProfile();
  const { user } = useAuth();
  // A coach's "home" is the coach dashboard, never the athlete one.
  const home = user ? homePathFor(user.roles) : "/dashboard";
  const { pathname } = useLocation();
  const unread = useUnreadCount();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const tabs = nav.filter((n) => TOP_TABS.includes(n.to));

  return (
    <AppHeader>
      {backTo && <HeaderBack to={backTo} />}
      <HeaderBrand to={home} label="Sportal home" />

      <nav aria-label="Main" className="ml-2 hidden items-center md:flex">
        {tabs.map(({ to: tabTo, label, icon }) => {
          const to = tabTo === "/dashboard" ? home : tabTo;
          return <HeaderNavItem key={tabTo} to={to} label={label} icon={icon} active={isActive(to)} />;
        })}
      </nav>

      <HeaderSearch placeholder="Search athletes, teams, or training sessions..." />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationBell count={unread} to="/notifications" />
        <HeaderPill>
          <Link to="/profile" direction="root" aria-label="My profile" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus">
            <HeaderUser name={`${athlete.firstName} ${athlete.lastName}`} shortName={athlete.firstName} src={juan} />
          </Link>
          <HeaderPillDivider />
          <MenuDropdown />
        </HeaderPill>
      </div>
    </AppHeader>
  );
}

/**
 * Top navigation for a school representative: three tabs (Dashboard, My Coaches, Coach Requests) with the
 * other pages (My Athletes, Scholarships) in the hamburger menu (the athlete tabs don't apply to them),
 * search, notifications, and their own name. There is no athlete profile page for them, so the name is
 * not a link; the menu also holds Notifications and Sign out.
 */
/** How many of the representative's pages are tabs in the top bar; the rest are in the menu. */
const REP_TABS = 3;

function RepTopBar({ backTo }: { backTo?: string }) {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const unread = useUnreadCount();
  const menu = useDropdown();
  const header = useRepHeader(user?.id);
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const name = header?.displayName ?? user?.displayName ?? "Representative";
  const shortName = header ? name.split(/\s+/)[0] ?? name : user?.firstName ?? name.split(/\s+/)[0] ?? name;
  const pending = header?.pendingCoachRequests ?? 0;
  const home = user ? homePathFor(user.roles) : "/rep/dashboard";

  return (
    <AppHeader>
      {backTo && <HeaderBack to={backTo} />}
      <HeaderBrand to={home} label="Sportal home" />

      <nav aria-label="Main" className="ml-2 hidden items-center md:flex">
        {repNav.slice(0, REP_TABS).map(({ to, label, icon }) => (
          <HeaderNavItem key={to} to={to} label={label} icon={icon} active={isActive(to)} badge={to === "/rep/requests" ? pending : 0} />
        ))}
      </nav>

      <HeaderSearch placeholder="Search scholarships..." />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationBell count={unread} to="/notifications" />
        <HeaderPill>
          <Link to="/rep/settings" direction="root" aria-label="Your profile and settings" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus">
            <HeaderUser name={name} shortName={shortName} {...(header?.avatar ? { src: header.avatar } : {})} />
          </Link>
          <HeaderPillDivider />
          <div ref={menu.ref} className="relative">
            <button
              type="button"
              onClick={() => menu.setOpen((v) => !v)}
              aria-label="Menu"
              aria-haspopup="menu"
              aria-expanded={menu.open}
              className="rounded-full p-1.5 transition hover:text-shell-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus"
            >
              <MenuGlyph open={menu.open} />
            </button>
            {menu.open && (
              <DropdownPanel>
                {repNav.map(({ to, label, icon: Icon }, i) => (
                  <Link key={to} to={to} direction="root" role="menuitem" className={cn(dropdownItemClass(isActive(to)), i < REP_TABS && "md:hidden")}>
                    <Icon className="h-4 w-4" />
                    {label}
                    {to === "/rep/requests" && pending > 0 && <CountBadge count={pending} />}
                  </Link>
                ))}
                <Link to="/rep/settings" direction="root" role="menuitem" className={dropdownItemClass(isActive("/rep/settings"))}>
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link to="/notifications" direction="root" role="menuitem" className={dropdownItemClass(isActive("/notifications"))}>
                  <Bell className="h-4 w-4" />
                  Notifications
                </Link>
                <DropdownDivider />
                <button type="button" role="menuitem" onClick={() => void signOut()} className={dropdownItemClass()}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </DropdownPanel>
            )}
          </div>
        </HeaderPill>
      </div>
    </AppHeader>
  );
}

/** Hamburger button that drops down the less important pages and Sign out. */
function MenuDropdown() {
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const { open, setOpen, ref } = useDropdown();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const items = nav.filter((n) => MENU_ITEMS.includes(n.to));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full p-1.5 transition hover:text-shell-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-focus"
      >
        <MenuGlyph open={open} />
      </button>
      {open && (
        <DropdownPanel>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} direction="root" role="menuitem" className={dropdownItemClass(isActive(to))}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <DropdownDivider />
          <button type="button" role="menuitem" onClick={() => void signOut()} className={dropdownItemClass()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}

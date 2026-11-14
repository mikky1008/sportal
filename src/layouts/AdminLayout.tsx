import type { ReactNode } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { useAuth } from "@/auth/AuthContext";
import { AppHeader, HeaderBrand, PageBody } from "@/components/shell";
import { btn } from "@/components/common";
import { Link } from "@/router-compat";
import { cn } from "@/lib/utils";

export const ADMIN_HOME = "/admin/dashboard";

/** A deliberately small shell for administrators: the brand, who is signed in, and Sign out. */
export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="min-h-full bg-background text-foreground">
          <AppHeader>
            <HeaderBrand to={ADMIN_HOME} label="Sportal admin home" />
            <span className="ml-2 hidden text-sm font-semibold text-shell-fg sm:inline">Administration</span>
            <nav aria-label="Administration" className="ml-4 flex items-center gap-1 text-sm">
              <Link to="/admin/dashboard" direction="root" className="rounded-full px-3 py-1.5 font-medium text-shell-fg hover:bg-white/10">Dashboard</Link>
              <Link to="/admin/verifications" direction="root" className="rounded-full px-3 py-1.5 font-medium text-shell-fg hover:bg-white/10">Coach verifications</Link>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-shell-muted sm:inline">{user?.displayName}</span>
              <button type="button" onClick={() => void signOut()} className={cn(btn.secondary, "px-3 py-1.5 text-xs")}>Sign out</button>
            </div>
          </AppHeader>
          <PageBody>{children}</PageBody>
        </div>
      </IonContent>
    </IonPage>
  );
}

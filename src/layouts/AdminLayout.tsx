import type { ReactNode } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { useAuth } from "@/auth/AuthContext";
import { AppHeader, HeaderBrand, PageBody } from "@/components/shell";
import { btn } from "@/components/common";
import { cn } from "@/lib/utils";

export const ADMIN_HOME = "/admin/verifications";

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

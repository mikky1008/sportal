import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as client from "./authClient";
import type { LoginResponse, PublicUser, RegisterInput, RegisterResponse } from "./types";
import { activateAccount, deactivateAccount, ensureLocalAccount } from "@/lib/accountScope";
import { primaryRole } from "@/lib/roles";
import { profileStore } from "@/lib/profileStore";
import { profileExtrasStore } from "@/lib/profileExtrasStore";
import { coachProfileStore } from "@/lib/coachProfileStore";
import { sessionStore } from "@/lib/sessionStore";

interface AuthValue {
  user: PublicUser | null;
  /** false until the saved session has been checked once at app start */
  ready: boolean;
  /** changes on every sign in / sign out so cached pages are thrown away */
  epoch: number;
  /** where to send the user right after signing in (consumed by the sign-in / sign-up routes) */
  landing: string | null;
  /** Checks the credentials with the API and saves the session. Does not change who is signed in yet. */
  signIn: (data: { identifier: string; password: string; remember: boolean }) => Promise<LoginResponse>;
  /** Creates the account and saves the session. Does not change who is signed in yet. */
  signUp: (data: RegisterInput) => Promise<RegisterResponse>;
  /** Make this user the signed-in one and go to `landing`. Call it after signIn / signUp succeeded. */
  accept: (user: PublicUser, landing?: string) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

/** Point the browser-side profile stores at this account's own data. */
function scopeStoresTo(user: PublicUser | null) {
  if (user) {
    // Signed in on a browser that never saw this account: rebuild it from the names the server saved.
    const role = primaryRole(user.roles);
    if (role && user.firstName && user.lastName) {
      ensureLocalAccount(user.id, {
        type: role === "student_athlete" ? "athlete" : "coach",
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
    activateAccount(user.id);
  } else deactivateAccount();
  profileStore.refresh();
  profileExtrasStore.refresh();
  coachProfileStore.refresh();
  sessionStore.refresh();
  // Profiles, showcase and sessions live on the server: load them for whoever just signed in.
  const role = user ? primaryRole(user.roles) : null;
  if (role === "coach") void coachProfileStore.load();
  if (role === "student_athlete") {
    void profileStore.load();
    void profileExtrasStore.load();
    void sessionStore.load();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [landing, setLanding] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    client
      .fetchCurrentUser()
      .catch(() => null) // server unreachable: show the sign-in page; the saved session is kept
      .then((u) => {
        if (!live) return;
        scopeStoresTo(u);
        setUser(u);
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const signIn = useCallback<AuthValue["signIn"]>((data) => client.login(data), []);
  const signUp = useCallback<AuthValue["signUp"]>((data) => client.register(data), []);

  const accept = useCallback<AuthValue["accept"]>((u, to) => {
    scopeStoresTo(u);
    setLanding(to ?? null);
    setUser(u);
    setEpoch((n) => n + 1);
  }, []);

  const signOut = useCallback(async () => {
    await client.logout();
    scopeStoresTo(null);
    setLanding(null);
    setUser(null);
    setEpoch((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ user, ready, epoch, landing, signIn, signUp, accept, signOut }),
    [user, ready, epoch, landing, signIn, signUp, accept, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

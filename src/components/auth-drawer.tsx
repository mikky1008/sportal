import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { useNavigate } from "@/router-compat";
import { LoginForm } from "@/pages/Login";
import { ROLES, type Role } from "@/pages/Signup";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

interface AuthDrawerProps {
  /** null = closed */
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}

/** Right-hand slide-over for signing in or choosing an account type, so visitors never leave the landing page. */
export function AuthDrawer({ mode, onModeChange, onClose }: AuthDrawerProps) {
  const navigate = useNavigate();

  // Close first: Ionic keeps this page mounted underneath the next one, so an open drawer would stay on top of it.
  const chooseRole = (role: Role) => {
    onClose();
    navigate({ to: "/signup", search: { role }, direction: "forward" });
  };

  return (
    <Dialog.Root open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-y-auto border-l border-slate-800 bg-slate-900 text-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-200 sm:max-w-md"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-between px-6 pt-6">
            <span className="flex items-center gap-2.5">
              <img src="/icon-192.png" alt="" aria-hidden="true" className="h-9 w-9 shrink-0 rounded-[22%]" />
              <span className="font-display text-xl font-bold tracking-wide">SPORTAL</span>
            </span>
            <Dialog.Close
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-10">
            {mode === "signup" ? (
              <div data-testid="drawer-signup-roles">
                <Dialog.Title className="font-sans text-3xl font-normal tracking-tight">Create your account</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-relaxed text-slate-400">Choose how you'll use Sportal.</Dialog.Description>

                <div className="mt-6 flex flex-col gap-3" role="group" aria-label="Account type">
                  {ROLES.map(({ id, title, blurb, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => chooseRole(id)}
                      className={cn(
                        "group flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-left transition",
                        "hover:border-sky-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                      )}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-400 transition group-hover:bg-sky-400 group-hover:text-slate-900">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">{title}</span>
                        <span className="block text-xs text-slate-400">{blurb}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-400" aria-hidden="true" />
                    </button>
                  ))}
                </div>

                <p className="mt-6 text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <button type="button" onClick={() => onModeChange("login")} className="font-semibold text-sky-400 hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            ) : (
              <>
                <Dialog.Title className="sr-only">Sign in</Dialog.Title>
                <Dialog.Description className="sr-only">Sign in to continue to your dashboard.</Dialog.Description>
                <LoginForm tone="dark" onSwitchToSignup={() => onModeChange("signup")} />
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

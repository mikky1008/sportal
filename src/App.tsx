import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/auth/AuthContext";
import { Page } from "@/components/Page";
import { Link } from "@/router-compat";
import { homePathFor, primaryRole } from "@/lib/roles";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import CompleteProfile from "@/pages/CompleteProfile";
import Dashboard from "@/pages/Dashboard";
import CoachDashboard from "@/pages/CoachDashboard";
import MyAthletes from "@/pages/MyAthletes";
import SessionReviews from "@/pages/SessionReviews";
import CoachApplications from "@/pages/CoachApplications";
import AdminVerifications from "@/pages/AdminVerifications";
import TrainingPlans from "@/pages/TrainingPlans";
import TrainingPlanDetail from "@/pages/TrainingPlanDetail";
import CreateTrainingPlan from "@/pages/CreateTrainingPlan";
import Profile from "@/pages/Profile";
import Performance from "@/pages/Performance";
import NewPractice from "@/pages/NewPractice";
import Analysis from "@/pages/Analysis";
import Rankings from "@/pages/Rankings";
import Scholarships from "@/pages/Scholarships";
import Recruiting from "@/pages/Recruiting";
import AthleteShowcase from "@/pages/AthleteShowcase";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";

setupIonicReact({ mode: "ios", animated: false });

/** Screens that need a signed-in user. Anyone else is sent to /login and brought back afterwards. */
const PROTECTED: { path: string; component: ComponentType }[] = [
  { path: "/complete-profile", component: CompleteProfile },
  { path: "/dashboard", component: Dashboard },
  { path: "/coach/dashboard", component: CoachDashboard },
  { path: "/coach/athletes", component: MyAthletes },
  { path: "/coach/reviews", component: SessionReviews },
  { path: "/coach/applications", component: CoachApplications },
  { path: "/admin/verifications", component: AdminVerifications },
  // "new" starts a blank plan; any other value is the id of the plan to edit
  { path: "/coach/training-plans/:planId", component: CreateTrainingPlan },
  { path: "/profile", component: Profile },
  { path: "/training-plans", component: TrainingPlans },
  { path: "/training-plans/:planId", component: TrainingPlanDetail },
  { path: "/performance", component: Performance },
  { path: "/performance/new", component: NewPractice },
  { path: "/performance/analysis", component: Analysis },
  { path: "/rankings", component: Rankings },
  { path: "/scholarships", component: Scholarships },
  { path: "/recruiting", component: Recruiting },
  { path: "/recruiting/:athleteId", component: AthleteShowcase },
  { path: "/notifications", component: Notifications },
  { path: "/settings", component: Settings },
];

function NotFound() {
  const { user } = useAuth();
  const home = user ? homePathFor(user.roles) : "/dashboard";
  return (
    <Page title="Not found">
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
          <div className="mt-6">
            <Link to={home} direction="root" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-hero">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-electric-gradient font-display text-3xl font-bold text-primary-foreground shadow-glow">S</span>
    </div>
  );
}

function Shell() {
  const { user, epoch, landing } = useAuth();
  const { pathname, search } = useLocation();
  const loginUrl = `/login?redirect=${encodeURIComponent(pathname + search)}`;

  return (
    <>
      {/* `key` throws the cached screens away on every sign in / sign out, so one account never sees another's */}
      <IonRouterOutlet id="main" key={epoch}>
        <Route exact path="/login" render={() => (user ? <Redirect to={landing ?? homePathFor(user.roles)} /> : <Login />)} />
        <Route exact path="/signup" render={() => (user ? <Redirect to={landing ?? homePathFor(user.roles)} /> : <Signup />)} />
        {PROTECTED.map(({ path, component: C }) => (
          <Route
            key={path}
            exact
            path={path}
            render={() => {
              if (!user) return <Redirect to={loginUrl} />;
              // Coaches have their own dashboard: never show them the athlete one, and vice versa.
              const isCoach = primaryRole(user.roles) === "coach";
              const isRep = primaryRole(user.roles) === "university_representative";
              const isAdmin = user.roles.includes("admin");
              if (path === "/dashboard" && (isCoach || isRep || isAdmin)) return <Redirect to={homePathFor(user.roles)} />;
              if (path.startsWith("/coach/") && !isCoach) return <Redirect to={homePathFor(user.roles)} />;
              return <C />;
            }}
          />
        ))}
        <Route exact path="/" render={() => <Redirect to={user ? homePathFor(user.roles) : "/login"} />} />
        <Route render={() => (user ? <NotFound /> : <Redirect to="/login" />)} />
      </IonRouterOutlet>
    </>
  );
}

export default function App() {
  const { ready } = useAuth();
  return (
    <IonApp>
      {ready ? (
        <IonReactRouter>
          <Shell />
        </IonReactRouter>
      ) : (
        <Splash />
      )}
      <Toaster richColors position="top-center" />
    </IonApp>
  );
}

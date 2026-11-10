import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, GraduationCap, Loader2, Menu, Search, Trophy, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/router-compat";
import { Page } from "@/components/Page";
import { cn } from "@/lib/utils";
import court from "@/assets/court.jpg";

/** Marketing landing page shown at `/` to signed-out visitors. */

const NAVY = "#0d2340";
type SectionId = "services" | "about" | "contact";

const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: "services", label: "Services" },
  { id: "about", label: "About Us" },
  { id: "contact", label: "Contact Us" },
];

const SERVICES = [
  {
    icon: Trophy,
    title: "Athlete Showcase",
    body: "Build a verified profile with your stats, highlights and training history. Every session shows how far to trust it: AI-assessed, coach-verified or self-reported.",
    points: ["Performance tracking and rankings", "Verification status on every session"],
  },
  {
    icon: Search,
    title: "Coach Recruitment",
    body: "Coaches search athletes across universities by sport, position and skill, save the ones they like and reach out directly.",
    points: ["Search and filter by what matters", "Compare athletes side by side"],
  },
  {
    icon: GraduationCap,
    title: "University Roster Hub",
    body: "Universities keep rosters, scholarships and recruiting activity in one place, so staff spend less time chasing spreadsheets and more time with athletes.",
    points: ["Roster and scholarship management", "Connections between coaches and athletes"],
  },
];

const PILLARS = [
  { title: "For student-athletes", body: "Be seen for your work on the court, not just the school you attend." },
  { title: "For collegiate coaches", body: "Find talent you would never have scouted, with data you can judge for yourself." },
  { title: "Across universities", body: "One shared platform, so opportunities are not limited by who you already know." },
];

const ROLES = ["Student-athlete", "Coach", "University representative", "Other"];

const field =
  "h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/40 hover:border-white/30 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 disabled:opacity-60";

const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-sky-400 px-7 py-3.5 text-base font-semibold text-[#0d2340] shadow-[0_10px_30px_-10px_rgb(56_189_248/0.7)] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/40 active:translate-y-px";
const ctaSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/70 px-7 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:translate-y-px";

function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-electric-gradient font-display text-lg font-bold text-primary-foreground shadow-glow">S</span>
      <span className="font-display text-xl font-bold tracking-wide text-white">SPORTAL</span>
    </span>
  );
}

function Section({ id, children, className }: { id: SectionId; children: ReactNode; className?: string }) {
  // scroll-mt keeps the heading clear of the sticky header
  return (
    <section id={id} className={cn("scroll-mt-16 px-4 py-20 sm:px-8 sm:py-24", className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, intro, dark }: { eyebrow: string; title: string; intro?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">{eyebrow}</p>
      <h2 className={cn("mt-3 font-display text-4xl font-bold uppercase leading-tight sm:text-5xl", dark ? "text-white" : "text-[#0d2340]")}>{title}</h2>
      {intro && <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", dark ? "text-white/70" : "text-muted-foreground")}>{intro}</p>}
    </div>
  );
}

function Header({ onJump }: { onJump: (id: SectionId) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const jump = (id: SectionId) => {
    setOpen(false);
    onJump(id);
  };

  const linkClass = "rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10" style={{ backgroundColor: NAVY }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-8">
        <Link to="/" direction="none" aria-label="Sportal home" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
          <Brand />
        </Link>

        <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ id, label }) => (
            <button key={id} type="button" onClick={() => jump(id)} className={linkClass}>
              {label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/login" direction="forward" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:inline-flex">
            Sign In
          </Link>
          <Link to="/signup" direction="forward" className="inline-flex items-center rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-[#0d2340] transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
            Sign Up
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="landing-mobile-menu" aria-label="Sections" className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden" style={{ backgroundColor: NAVY }}>
          {NAV_LINKS.map(({ id, label }) => (
            <button key={id} type="button" onClick={() => jump(id)} className="block w-full rounded-xl px-3 py-3 text-left text-base font-medium text-white/90 hover:bg-white/10">
              {label}
            </button>
          ))}
          <Link to="/login" direction="forward" className="mt-1 block rounded-xl px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10 sm:hidden">
            Sign In
          </Link>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden" style={{ backgroundColor: NAVY }}>
      {/* dark blue court at 50% over the navy */}
      <img src={court} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" width={1600} height={640} fetchPriority="high" />
      {/* keeps the headline readable and melts the bottom edge into the next section */}
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: `linear-gradient(180deg, ${NAVY}99 0%, transparent 35%, transparent 65%, ${NAVY} 100%)` }} />

      <div className="mx-auto flex min-h-[min(40rem,calc(100dvh-4rem))] max-w-7xl flex-col justify-center px-4 py-20 sm:px-8 sm:py-28">
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300 backdrop-blur">
          Athlete profiling for collegiate recruiting
        </p>
        <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
          Build your profile.
          <br />
          <span className="text-sky-400">Get discovered.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
          Track your training, show verified performance and get in front of coaches at universities across the country.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link to="/signup" direction="forward" className={ctaPrimary}>
            Sign Up Now <ArrowRight className="h-5 w-5" />
          </Link>
          <Link to="/signup" direction="forward" className={ctaSecondary}>
            Create Account
          </Link>
        </div>
        <p className="mt-5 text-sm text-white/60">
          Already have an account?{" "}
          <Link to="/login" direction="forward" className="font-semibold text-white underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}

function Services() {
  return (
    <Section id="services" className="bg-background">
      <SectionHeading eyebrow="Services" title="Everything between the court and the roster" intro="One platform for the three groups that make recruiting work." />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {SERVICES.map(({ icon: Icon, title, body, points }) => (
          <article key={title} className="group surface flex flex-col p-7 transition hover:-translate-y-1 hover:shadow-glow">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-electric-gradient text-primary-foreground shadow-glow">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-display text-2xl font-bold uppercase text-[#0d2340]">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            <ul className="mt-5 space-y-2 border-t pt-5 text-sm text-foreground">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}

function About() {
  return (
    <Section id="about" className="text-white">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            dark
            eyebrow="About Us"
            title="Bridging student-athletes and collegiate coaches"
            intro="Great athletes get missed when recruiting depends on who knows whom. Sportal's mission is to close that gap: give student-athletes a credible profile of their performance, and give coaches at every university a clear, searchable way to find them."
          />
          <Link to="/signup" direction="forward" className={cn(ctaPrimary, "mt-8")}>
            Join Sportal <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <ul className="space-y-4">
          {PILLARS.map(({ title, body }, i) => (
            <li key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-400/15 font-display text-lg font-bold text-sky-300">{i + 1}</span>
              <div>
                <h3 className="font-display text-xl font-bold uppercase text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

function Contact() {
  const [values, setValues] = useState({ name: "", email: "", role: ROLES[0], message: "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    const errs: ContactErrors = {};
    if (!values.name.trim()) errs.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errs.email = "Enter a valid email address.";
    if (values.message.trim().length < 10) errs.message = "Tell us a little more (at least 10 characters).";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    // TODO: no contact endpoint exists yet. Post to the API here once there is one.
    await new Promise((r) => setTimeout(r, 400));
    setSending(false);
    toast.success("Thanks! We'll get back to you soon.");
    setValues({ name: "", email: "", role: ROLES[0], message: "" });
  }

  return (
    <Section id="contact" className="bg-background">
      <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
        <div className="lg:col-span-2">
          <SectionHeading eyebrow="Contact Us" title="Questions? Let's talk" intro="Whether you are an athlete, a coach or run a university program, send us a note and we'll point you in the right direction." />
        </div>

        <form onSubmit={onSubmit} noValidate className="rounded-3xl p-6 sm:p-8 lg:col-span-3" style={{ backgroundColor: NAVY }} aria-label="Contact form">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" id="c-name" error={errors.name}>
              <input id="c-name" name="name" autoComplete="name" maxLength={100} value={values.name} onChange={set("name")} disabled={sending} placeholder="Your name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} />
            </Field>
            <Field label="Email" id="c-email" error={errors.email}>
              <input id="c-email" name="email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={set("email")} disabled={sending} placeholder="you@university.edu" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-err" : undefined} />
            </Field>
          </div>
          <div className="mt-5">
            <Field label="I am a" id="c-role">
              <select id="c-role" name="role" value={values.role} onChange={set("role")} disabled={sending} className={cn(field, "[&>option]:text-foreground")}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5">
            <Field label="Message" id="c-message" error={errors.message}>
              <textarea id="c-message" name="message" rows={5} maxLength={2000} value={values.message} onChange={set("message")} disabled={sending} placeholder="How can we help?" className={cn(field, "h-auto resize-y py-3")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-message-err" : undefined} />
            </Field>
          </div>
          <button type="submit" disabled={sending} className={cn(ctaPrimary, "mt-6 w-full disabled:opacity-60 sm:w-auto")}>
            {sending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Sending…
              </>
            ) : (
              "Send message"
            )}
          </button>
        </form>
      </div>
    </Section>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-white">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Footer({ onJump }: { onJump: (id: SectionId) => void }) {
  const linkClass = "rounded text-sm text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";
  return (
    <footer className="border-t border-white/10 px-4 py-14 sm:px-8" style={{ backgroundColor: "#091a31" }}>
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">Build your profile. Get discovered. Connecting student-athletes and collegiate coaches across universities.</p>
        </div>
        <nav aria-label="Platform">
          <h4 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">Platform</h4>
          <ul className="mt-4 space-y-3">
            <li><Link to="/signup" direction="forward" className={linkClass}>Sign Up</Link></li>
            <li><Link to="/login" direction="forward" className={linkClass}>Sign In</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <h4 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">Explore</h4>
          <ul className="mt-4 space-y-3">
            {NAV_LINKS.map(({ id, label }) => (
              <li key={id}>
                <button type="button" onClick={() => onJump(id)} className={linkClass}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl items-center gap-2 border-t border-white/10 pt-6 text-xs text-white/50">
        <UserRound className="h-4 w-4" aria-hidden="true" />
        <span>© {new Date().getFullYear()} Sportal. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  const jump = (id: SectionId) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <Page shell={false}>
      <div ref={rootRef} className="min-h-[100dvh]" style={{ backgroundColor: NAVY }}>
        <Header onJump={jump} />
        <main>
          <Hero />
          <Services />
          <div style={{ backgroundColor: NAVY }}>
            <About />
          </div>
          <Contact />
        </main>
        <Footer onJump={jump} />
      </div>
    </Page>
  );
}

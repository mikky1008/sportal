import { useCallback, useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Search, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { Card, EmptyState, PageHeader, Select, btn } from "@/components/common";
import { useAuth } from "@/auth/AuthContext";
import { homePathFor, primaryRole } from "@/lib/roles";
import { fetchRepAthletes } from "@/lib/repAthletesApi";
import { fetchRepCoaches } from "@/lib/repCoachesApi";
import {
  BODY_MAX, SUBJECT_MAX, fetchSentMessages, previewMessage, sendMessage,
  type Audience, type AudienceChoice, type Preview, type SentMessage,
} from "@/lib/repMessagesApi";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------------------------
   SCHOOL REPRESENTATIVE: MESSAGES  (route: /rep/messages)

   A one-way message or announcement to the coaches and athletes of the representative's OWN school.
   Only people the representative can already see on My Coaches / My Athletes can be reached; the
   server enforces that. Recipients get it as a notification naming the sender and the school; they
   can't reply here. The page shows how many people a message would reach before it is sent.
--------------------------------------------------------------------------------------------- */

const field = "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60";

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: "coaches", label: "All coaches", hint: "Affiliated coaches of your school" },
  { value: "athletes", label: "All athletes", hint: "Everyone on My Athletes" },
  { value: "verified_athletes", label: "Verified athletes", hint: "Confirmed by a coach of your school" },
  { value: "everyone", label: "Coaches and athletes", hint: "Everyone above" },
  { value: "person", label: "One person", hint: "A single coach or athlete" },
];

const when = (iso: string) => {
  try { return format(parseISO(iso), "MMM d, yyyy 'at' h:mm a"); } catch { return iso; }
};
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

interface Person { id: string; name: string; detail: string }

/* ---- who: one coach or athlete ---- */

function PersonPicker({ person, onPick }: { person: Person | null; onPick: (p: Person | null) => void }) {
  const [kind, setKind] = useState<"coach" | "athlete">("coach");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[] | null>(null);

  useEffect(() => {
    if (person) return;
    let live = true;
    const t = setTimeout(() => {
      const run = kind === "coach"
        ? fetchRepCoaches({ q, sport: "", status: "affiliated" }, 0).then((r) => (r.ok ? r.data.items.filter((c) => c.accountActive).map((c) => ({ id: c.id, name: c.name, detail: [c.sport, c.position].filter(Boolean).join(" · ") })) : []))
        : fetchRepAthletes({ q, sport: "", status: "" }, 0).then((r) => (r.ok ? r.data.items.map((a) => ({ id: a.id, name: a.name, detail: [a.sport, a.position].filter(Boolean).join(" · ") })) : []));
      void run.then((list) => { if (live) setResults(list.slice(0, 8)); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [kind, q, person]);

  if (person)
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-accent px-3 py-2.5">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{person.name}</p>{person.detail && <p className="truncate text-xs text-muted-foreground">{person.detail}</p>}</div>
        <button type="button" className={cn(btn.secondary, btn.sm)} onClick={() => { onPick(null); setQ(""); setResults(null); }}>Change</button>
      </div>
    );

  return (
    <div>
      <div role="group" aria-label="Coach or athlete" className="mb-3 flex gap-2">
        {(["coach", "athlete"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setResults(null); }}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", kind === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
            {k === "coach" ? "Coach" : "Athlete"}
          </button>
        ))}
      </div>
      <label className="relative block">
        <span className="sr-only">Search by name</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${kind === "coach" ? "coaches" : "athletes"} by name`} maxLength={80} className={cn(field, "pl-9")} />
      </label>
      <ul className="mt-2 flex flex-col gap-1.5" aria-label="Matching people">
        {results === null ? <li className="px-1 text-xs text-muted-foreground">Searching…</li>
          : results.length === 0 ? <li className="px-1 text-xs text-muted-foreground">No {kind === "coach" ? "affiliated coaches" : "athletes"} match.</li>
          : results.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onPick(p)} className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-left text-sm hover:bg-muted">
                <span className="min-w-0 truncate font-medium">{p.name}</span><span className="shrink-0 truncate text-xs text-muted-foreground">{p.detail}</span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

/* ---- compose ---- */

function Compose({ sports, onSent }: { sports: string[]; onSent: () => void }) {
  const [audience, setAudience] = useState<Audience>("athletes");
  const [sport, setSport] = useState("");
  const [person, setPerson] = useState<Person | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const choice: AudienceChoice | null = audience === "person" ? (person ? { audience, recipientId: person.id } : null) : { audience, ...(sport ? { sport } : {}) };
  const choiceKey = choice ? JSON.stringify(choice) : "";

  // How many people would this reach? Asked again whenever the audience changes.
  useEffect(() => {
    setConfirming(false); setPreview(null); setPreviewError("");
    if (!choice) return;
    const ctrl = new AbortController();
    setChecking(true);
    const t = setTimeout(() => {
      void previewMessage(choice, ctrl.signal).then((r) => {
        if (ctrl.signal.aborted) return;
        setChecking(false);
        if (r.ok) setPreview(r.data.preview); else if (r.code !== "aborted") setPreviewError(r.message);
      });
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choiceKey]);

  const ready = !!choice && !!preview && preview.count > 0 && subject.trim().length >= 3 && body.trim().length > 0;

  async function send() {
    if (!choice) return;
    setBusy(true); setErrors({});
    const r = await sendMessage(choice, { subject, body });
    setBusy(false);
    setConfirming(false);
    if (!r.ok) {
      setErrors({ ...((r.fieldErrors as Record<string, string> | undefined) ?? {}), ...(r.fieldErrors ? {} : { form: r.message }) });
      return;
    }
    toast.success(`Message sent to ${people(r.data.message.recipientCount)}`);
    setSubject(""); setBody("");
    onSent();
  }

  return (
    <Card title="New message">
      <form onSubmit={(e) => { e.preventDefault(); if (ready) setConfirming(true); }} noValidate className="flex flex-col gap-5">
        <fieldset>
          <legend className="text-sm font-medium">Send to</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {AUDIENCES.map((a) => (
              <label key={a.value} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition", audience === a.value ? "border-primary bg-accent" : "bg-card hover:bg-muted")}>
                <input type="radio" name="audience" value={a.value} checked={audience === a.value} onChange={() => { setAudience(a.value); setErrors({}); }} className="mt-1" />
                <span><span className="block font-semibold">{a.label}</span><span className="block text-xs text-muted-foreground">{a.hint}</span></span>
              </label>
            ))}
          </div>
          {errors["audience"] && <p role="alert" className="mt-1 text-xs text-destructive">{errors["audience"]}</p>}
        </fieldset>

        {audience === "person" ? (
          <div>
            <PersonPicker person={person} onPick={setPerson} />
            {errors["recipientId"] && <p role="alert" className="mt-1 text-xs text-destructive">{errors["recipientId"]}</p>}
          </div>
        ) : (
          <div className="sm:max-w-xs">
            <label htmlFor="msg-sport" className="text-sm font-medium">Sport <span className="font-normal text-muted-foreground">(optional)</span></label>
            <div className="mt-1.5">
              <Select id="msg-sport" value={sport} onChange={(e) => setSport(e.target.value)}>
                <option value="">All sports</option>
                {sports.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        )}

        <p aria-live="polite" className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm", preview && preview.count === 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!choice ? "Choose the person to message."
            : previewError ? previewError
            : checking || !preview ? "Checking who this will reach…"
            : preview.count === 0 ? "No one matches that choice. Try another sport or audience."
            : audience === "person" ? `This will notify ${preview.label}.`
            : `This will notify ${people(preview.count)}${audience === "everyone" ? ` (${preview.coaches} ${preview.coaches === 1 ? "coach" : "coaches"}, ${preview.athletes} ${preview.athletes === 1 ? "athlete" : "athletes"})` : ""}.`}
        </p>

        <div>
          <label htmlFor="msg-subject" className="text-sm font-medium">Subject</label>
          <input id="msg-subject" className={cn(field, "mt-1.5", errors["subject"] && "border-destructive")} value={subject} maxLength={SUBJECT_MAX} onChange={(e) => setSubject(e.target.value)} placeholder="For example: Practice schedule this week"
            aria-invalid={errors["subject"] ? true : undefined} aria-describedby={errors["subject"] ? "msg-subject-error" : undefined} />
          {errors["subject"] && <p id="msg-subject-error" role="alert" className="mt-1 text-xs text-destructive">{errors["subject"]}</p>}
        </div>
        <div>
          <label htmlFor="msg-body" className="text-sm font-medium">Message</label>
          <textarea id="msg-body" rows={6} className={cn(field, "mt-1.5 resize-y", errors["body"] && "border-destructive")} value={body} maxLength={BODY_MAX} onChange={(e) => setBody(e.target.value)}
            aria-invalid={errors["body"] ? true : undefined} aria-describedby="msg-body-help" />
          <div id="msg-body-help" className="mt-1 flex items-start justify-between gap-3 text-xs">
            <span role="alert" className="text-destructive">{errors["body"]}</span>
            <span className="shrink-0 text-muted-foreground">{body.length}/{BODY_MAX}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">People see this in their notifications, with your name, position and school. It's one-way: they can't reply here.</p>
        {errors["form"] && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errors["form"]}</p>}

        {confirming && preview ? (
          <div role="alertdialog" aria-label="Confirm sending" className="rounded-2xl border p-4">
            <p className="text-sm">Send <strong>“{subject.trim()}”</strong> to {audience === "person" ? <strong>{preview.label}</strong> : <strong>{people(preview.count)}</strong>}? It can't be taken back.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={cn(btn.secondary, btn.sm)} disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
              <button type="button" className={cn(btn.primary, btn.sm)} disabled={busy} onClick={() => void send()}>{busy ? "Sending…" : "Yes, send"}</button>
            </div>
          </div>
        ) : (
          <div><button type="submit" className={cn(btn.primary, "inline-flex items-center gap-2")} disabled={!ready}><Send className="h-4 w-4" aria-hidden="true" />Send message</button></div>
        )}
      </form>
    </Card>
  );
}

/* ---- sent history ---- */

function SentItem({ m }: { m: SentMessage }) {
  const [open, setOpen] = useState(false);
  const long = m.body.length > 160 || m.body.includes("\n");
  return (
    <li className="border-b py-4 first:pt-0 last:border-b-0 last:pb-0">
      <p className="break-words font-semibold">{m.subject}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">To {m.label} · {people(m.recipientCount)} · <time dateTime={m.createdAt}>{when(m.createdAt)}</time></p>
      <p className="mt-2 whitespace-pre-line break-words text-sm">{open || !long ? m.body : `${m.body.split("\n")[0]!.slice(0, 160)}…`}</p>
      {long && <button type="button" className="mt-1 text-xs font-semibold text-primary" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Show more"}</button>}
    </li>
  );
}

function SentHistory({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<SentMessage[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);

  const load = useCallback(() => {
    setError("");
    void fetchSentMessages(0).then((r) => { if (r.ok) { setItems(r.data.items); setTotal(r.data.total); } else setError(r.message); });
  }, []);
  useEffect(load, [load, refreshKey]);

  async function showMore() {
    setMore(true);
    const r = await fetchSentMessages(items?.length ?? 0);
    setMore(false);
    if (r.ok) { setItems((cur) => [...(cur ?? []), ...r.data.items]); setTotal(r.data.total); } else setError(r.message);
  }

  return (
    <Card title={`Sent messages${items && total > 0 ? ` (${total})` : ""}`}>
      {error ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-4 text-center"><p className="text-sm text-muted-foreground">{error}</p><button type="button" className={cn(btn.secondary, btn.sm)} onClick={load}>Try again</button></div>
      ) : items === null ? <div role="status" aria-label="Loading sent messages" className="h-24 animate-pulse rounded-xl bg-muted" />
      : items.length === 0 ? <EmptyState message="You haven't sent any messages yet." />
      : (
        <>
          <ul>{items.map((m) => <SentItem key={m.id} m={m} />)}</ul>
          {items.length < total && <div className="pt-4 text-center"><button type="button" className={btn.secondary} disabled={more} onClick={() => void showMore()}>{more ? "Loading…" : "Show more"}</button></div>}
        </>
      )}
    </Card>
  );
}

/* ---- page ---- */

function RepMessages() {
  const [sports, setSports] = useState<string[]>([]);
  const [school, setSchool] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    void Promise.all([fetchRepCoaches({ q: "", sport: "", status: "affiliated" }, 0), fetchRepAthletes({ q: "", sport: "", status: "" }, 0)]).then(([c, a]) => {
      const all = new Set<string>();
      if (c.ok) c.data.sports.forEach((s) => all.add(s));
      if (a.ok) a.data.sports.forEach((s) => all.add(s));
      setSports([...all].sort((x, y) => x.localeCompare(y)));
      setSchool(a.ok ? a.data.school.name : c.ok ? c.data.school.name : "");
    });
  }, []);

  return (
    <div>
      <PageHeader title="Messages" subtitle={school ? `Send a message or announcement to the coaches and athletes of ${school}` : "Send a message or announcement to the coaches and athletes of your school"} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><Compose sports={sports} onSent={() => setRefresh((n) => n + 1)} /></div>
        <div className="lg:col-span-2"><SentHistory refreshKey={refresh} /></div>
      </div>
    </div>
  );
}

export default function RepMessagesPage() {
  const { user } = useAuth();
  // Only school representatives have this page; anyone else goes to their own home.
  if (user && primaryRole(user.roles) !== "university_representative") return <Redirect to={homePathFor(user.roles)} />;
  return (
    <Page title="Messages">
      <RepMessages />
    </Page>
  );
}

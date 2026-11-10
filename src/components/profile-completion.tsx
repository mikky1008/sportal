import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronRight, PartyPopper, Sparkles } from "lucide-react";
import type { CompletionResult, CompletionSection } from "@/lib/profileCompletion";
import { cn } from "@/lib/utils";

/** Renders a section (or the Continue button) as whatever the page needs: a router link or a button. */
export type RenderAction = (section: CompletionSection, className: string, children: ReactNode) => ReactNode;

const continueBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Horizontal bar that fills from empty on first paint and animates to each new value. */
export function AnimatedBar({ percent, label }: { percent: number; label: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-3.5 w-full overflow-hidden rounded-full bg-success/15"
    >
      <div
        className="h-full rounded-full bg-success transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${shown}%` }}
      />
    </div>
  );
}

function StatusIcon({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-white" data-state="complete">
      <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
    </span>
  ) : (
    <span className="h-7 w-7 shrink-0 rounded-full border-2 border-muted-foreground/40" data-state="incomplete" aria-hidden="true" />
  );
}

export function CompletionCard({
  title,
  result,
  message,
  renderAction,
  note,
  footer,
  completeText,
  testId,
}: {
  title: string;
  result: CompletionResult;
  message: string;
  renderAction: RenderAction;
  /** small print under the sections */
  note?: ReactNode;
  /** extra content under the sections (the coach's verification status) */
  footer?: ReactNode;
  /** shown on the compact banner once everything is done */
  completeText?: ReactNode;
  testId?: string;
}) {
  const { percent, sections, next, complete } = result;

  if (complete) {
    return (
      <section
        data-testid={testId}
        className="flex flex-col gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success text-white">
            <PartyPopper className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-tight">{title.replace(/^Complete /, "")} — 100% complete</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        {completeText}
        {footer}
      </section>
    );
  }

  return (
    <section data-testid={testId} className="surface p-5 sm:p-6" aria-labelledby={`${testId ?? "completion"}-title`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`${testId ?? "completion"}-title`} className="text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span data-testid="completion-message">{message}</span>
          </p>
        </div>
        <p className="shrink-0 font-display text-4xl font-bold leading-none text-success sm:text-5xl" aria-live="polite">
          <span data-testid="completion-percent">{percent}</span>
          <span className="text-2xl sm:text-3xl">%</span>
        </p>
      </div>

      <div className="mt-4">
        <AnimatedBar percent={percent} label={title} />
      </div>

      <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <li key={s.id} className="min-w-0">
            {renderAction(
              s,
              cn(
                "flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                s.complete ? "border-success/30 bg-success/5" : "bg-card",
              ),
              <>
                <StatusIcon complete={s.complete} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{s.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="sr-only">{s.complete ? "Completed. " : "Not completed. "}</span>
                    {s.complete ? "Completed" : s.doneCount > 0 ? `${s.doneCount} of ${s.fields.length} done · needs ${s.missing.join(", ").toLowerCase()}` : `Not started · ${s.fields.length} ${s.fields.length === 1 ? "item" : "items"}`}
                  </span>
                </span>
                <span className={cn("shrink-0 text-xs font-bold", s.complete ? "text-success" : "text-muted-foreground")}>{s.weight}%</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </>,
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {note && <p className="text-xs text-muted-foreground sm:max-w-md">{note}</p>}
        {next && (
          <div className="sm:ml-auto">
            {renderAction(next, cn(continueBtn, "w-full sm:w-auto"), <>Continue Setup<ArrowRight className="h-4 w-4" aria-hidden="true" /></>)}
          </div>
        )}
      </div>
      {footer && <div className="mt-4 border-t pt-4">{footer}</div>}
    </section>
  );
}

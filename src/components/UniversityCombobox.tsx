import { useEffect, useRef, useState } from "react";
import { searchUniversities, type UniversitySuggestion } from "@/lib/universitySearchApi";
import { cn } from "@/lib/utils";

/**
 * A text field that suggests schools that already exist on Sportal as you type, and still accepts anything.
 *
 *  - Suggestions are only a shortcut: whatever is in the box is the value, so a school that isn't listed is
 *    simply typed (a note under the list says so).
 *  - Picking a suggestion fills in the school's exact name, so the coach is linked to that school's
 *    representative. Leaving the box also tidies extra spaces, and fixes the capital letters if what was
 *    typed is a listed school.
 *  - Follows the standard ARIA "combobox with list" pattern: Arrow keys move, Enter picks, Escape closes,
 *    and screen readers hear how many schools were found.
 * Styling comes from the form (`className` is the form's own input style; `dark` is the navy drawer).
 */
export function UniversityCombobox({
  id, name, value, onValue, className, disabled, invalid, describedBy, dark, maxLength, placeholder,
}: {
  id: string;
  name: string;
  value: string;
  onValue: (v: string) => void;
  className: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string | undefined;
  dark?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UniversitySuggestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${id}-suggestions`;

  // Ask for suggestions as the text changes, once the box is open (a short pause so typing isn't one request per key).
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      void searchUniversities(value, ctrl.signal).then((r) => {
        if (ctrl.signal.aborted) return;
        setItems(r.ok ? r.data.items : []);
        setLoaded(true);
        setActive(-1);
      });
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [value, open]);

  const showList = open && items.length > 0;
  const typed = value.trim().length > 0;

  function pick(s: UniversitySuggestion) {
    onValue(s.name);
    setOpen(false);
  }

  function tidy() {
    const v = value.replace(/\s+/g, " ").trim();
    const exact = items.find((s) => s.name.toLowerCase() === v.toLowerCase());
    const next = exact ? exact.name : v;
    if (next !== value) onValue(next);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (items.length > 0) setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open && items.length > 0) setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      const s = open ? items[active] : undefined;
      if (s) { e.preventDefault(); pick(s); }          // otherwise Enter submits the form as usual
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const panel = dark ? "border-slate-700 bg-slate-800 text-white" : "border-border bg-card text-foreground";
  const muted = dark ? "text-slate-400" : "text-muted-foreground";

  return (
    <div className="relative">
      <input
        id={id} name={name} type="text" role="combobox" value={value} className={className} disabled={disabled}
        maxLength={maxLength} placeholder={placeholder} autoComplete="off" autoCapitalize="words" spellCheck={false}
        aria-autocomplete="list" aria-expanded={showList} aria-controls={listId}
        {...(showList && active >= 0 ? { "aria-activedescendant": `${id}-option-${active}` } : {})}
        aria-invalid={invalid ? true : undefined} aria-describedby={describedBy}
        onChange={(e) => { onValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); tidy(); }}
        onKeyDown={onKeyDown}
      />
      <span className="sr-only" aria-live="polite">
        {open && loaded ? (items.length > 0 ? `${items.length} ${items.length === 1 ? "school" : "schools"} found. Use the arrow keys to choose.` : "No matching school. You can keep typing your own.") : ""}
      </span>

      {open && (showList || (loaded && typed)) && (
        <div className={cn("absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border shadow-lg", panel)}>
          {showList ? (
            <ul id={listId} role="listbox" aria-label="Schools on Sportal" className="max-h-60 overflow-auto py-1">
              {items.map((s, i) => (
                <li
                  key={s.name} id={`${id}-option-${i}`} role="option" aria-selected={i === active}
                  // mouse down (not click) so the box doesn't lose focus and close before the pick lands
                  onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2.5 text-sm", i === active && (dark ? "bg-slate-700" : "bg-accent"))}
                >
                  <span className="min-w-0 truncate font-medium">{s.name}</span>
                  {s.location && <span className={cn("shrink-0 text-xs", muted)}>{s.location}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn("px-4 py-3 text-sm", muted)}>No matching school yet. We'll use “{value.trim()}” exactly as you typed it.</p>
          )}
          <p className={cn("border-t px-4 py-2 text-xs", dark ? "border-slate-700 text-slate-400" : "border-border text-muted-foreground")}>Not on the list? Just type your school's name.</p>
        </div>
      )}
    </div>
  );
}

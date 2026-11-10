import { Fragment, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Page } from "@/components/Page";
import { Link } from "@/router-compat";
import termsMd from "@/legal/terms.md?raw";
import privacyMd from "@/legal/privacy.md?raw";

/** Bold (**text**) and bare links inside one line of text. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|(https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${keyPrefix}-b${i}`} className="font-semibold text-white">{m[1]}</strong>);
    else out.push(<a key={`${keyPrefix}-a${i}`} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline-offset-4 hover:underline">{m[2]}</a>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** A tiny renderer for the handful of markdown features the legal text uses: headings, bullet lists, paragraphs, bold and links. */
function renderMarkdown(md: string): { title: string; body: ReactNode[] } {
  const lines = md.replace(/\r/g, "").split("\n");
  const body: ReactNode[] = [];
  let title = "";
  let para: string[] = [];
  let list: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (!para.length) return;
    const k = key++;
    body.push(
      <p key={`p${k}`} className="mt-3 leading-relaxed text-slate-300">
        {para.map((l, idx) => (
          <Fragment key={idx}>
            {idx > 0 && <br />}
            {inline(l, `p${k}-${idx}`)}
          </Fragment>
        ))}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const k = key++;
    body.push(
      <ul key={`ul${k}`} className="mt-3 list-disc space-y-2 pl-6 text-slate-300 marker:text-sky-400">
        {list.map((l, idx) => <li key={idx} className="leading-relaxed">{inline(l, `ul${k}-${idx}`)}</li>)}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if (line.startsWith("### ")) { flushPara(); flushList(); body.push(<h3 key={`h${key++}`} className="mt-6 text-lg font-semibold text-white">{line.slice(4)}</h3>); continue; }
    if (line.startsWith("## ")) { flushPara(); flushList(); body.push(<h2 key={`h${key++}`} className="mt-10 border-b border-slate-800 pb-2 font-display text-2xl font-bold tracking-wide text-white">{line.slice(3)}</h2>); continue; }
    if (line.startsWith("# ")) { flushPara(); flushList(); const t = line.slice(2); if (t.toUpperCase() !== "SPORTAL") title = t; continue; }
    if (line.startsWith("- ")) { flushPara(); list.push(line.slice(2)); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return { title, body };
}

function LegalScreen({ markdown, other }: { markdown: string; other: { to: string; label: string } }) {
  const { title, body } = renderMarkdown(markdown);
  return (
    <div className="min-h-[100dvh] bg-slate-950 px-4 py-8 text-white sm:px-8" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" direction="root" className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-sky-400 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Sportal
          </Link>
          <Link to={other.to} direction="none" className="text-sm text-slate-400 hover:text-white">{other.label}</Link>
        </div>
        <div className="mt-8 flex items-center gap-2.5">
          <img src="/icon-192.png" alt="" aria-hidden="true" className="h-9 w-9 shrink-0 rounded-[22%]" />
          <span className="font-display text-xl font-bold tracking-wide">SPORTAL</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">{title}</h1>
        <article>{body}</article>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <Page shell={false}>
      <LegalScreen markdown={termsMd} other={{ to: "/privacy", label: "Privacy Policy" }} />
    </Page>
  );
}

export function PrivacyPage() {
  return (
    <Page shell={false}>
      <LegalScreen markdown={privacyMd} other={{ to: "/terms", label: "Terms and Conditions" }} />
    </Page>
  );
}

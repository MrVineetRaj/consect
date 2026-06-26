import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BellIcon,
  BotIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  HashIcon,
  HexagonIcon,
  LockIcon,
  type LucideIcon,
  MessagesSquareIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/shared/count-up";
import { Reveal } from "@/components/shared/reveal";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Consect — AI-native team chat",
  description:
    "Consect brings real-time channels, DMs and groups together with an AI Hub that answers from your team's own documents. Chat, share, and let AI do the recall.",
};

const PRIMARY_FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: HashIcon,
    title: "Channels for everything",
    body: "Organize work into focused channels. Public for the whole workspace, private for the people who need them.",
  },
  {
    icon: MessagesSquareIcon,
    title: "DMs & group chats",
    body: "Quick one-on-ones or a huddle with a few teammates — every conversation keeps its own context.",
  },
  {
    icon: ZapIcon,
    title: "Real-time presence",
    body: "See who's online the moment they arrive. Messages, typing and presence land instantly over web sockets.",
  },
  {
    icon: UsersIcon,
    title: "Multi-workspace",
    body: "Run separate workspaces for teams, clients or projects — each fully isolated, switchable in a click.",
  },
  {
    icon: BellIcon,
    title: "An activity feed that matters",
    body: "Mentions, replies and reactions roll up into one place so nothing important slips past you.",
  },
  {
    icon: LockIcon,
    title: "Scoped access",
    body: "Knowledge and channels respect membership. People — and the AI — only see what they're allowed to.",
  },
];

const AI_HUB_POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: FileTextIcon,
    title: "Drop in any source",
    body: "PDFs, Word docs, Markdown, plain text or a URL — Consect ingests it and keeps it fresh.",
  },
  {
    icon: SparklesIcon,
    title: "Automatically vectorized",
    body: "Every source is chunked, embedded and indexed the moment it's added. No setup, no pipelines.",
  },
  {
    icon: SearchIcon,
    title: "Grounded answers",
    body: "Ask in any channel and get answers cited from your own knowledge — not the open internet.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your workspace",
    body: "Spin up a workspace, invite your team and set up the channels your work actually lives in.",
  },
  {
    step: "02",
    title: "Feed the AI Hub",
    body: "Upload the docs, specs and links your team relies on. Consect indexes them automatically.",
  },
  {
    step: "03",
    title: "Chat and ask anything",
    body: "Message in real time and let the AI recall the right answer from your knowledge on demand.",
  },
];

const SOURCE_TYPES = ["PDF", "Word", "Markdown", "Plain text", "URL"];

const STATS: { value: number; suffix?: string; label: string }[] = [
  { value: 5, suffix: "+", label: "Source formats indexed" },
  { value: 60, suffix: "ms", label: "Realtime message latency" },
  { value: 100, suffix: "%", label: "Answers from your own data" },
  { value: 24, suffix: "/7", label: "Knowledge on call" },
];

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <HexagonIcon className="size-5 fill-current/20" strokeWidth={2.25} />
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight">
        Consect
      </span>
    </Link>
  );
}

/** Animated aurora orbs + faint grid behind hero / CTA sections. */
function AnimatedBackdrop({ grid = true }: { grid?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {grid && <div className="bg-grid absolute inset-0" />}
      <div className="animate-aurora absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <div
        className="animate-aurora absolute -right-24 top-24 size-[28rem] rounded-full bg-accent/25 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-aurora absolute -left-24 top-48 size-[24rem] rounded-full bg-chart-4/20 blur-3xl"
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}

/** A stylized mock of the product chat UI — pure markup, no data. */
function ProductPreview() {
  return (
    <div className="animate-float-slow relative rounded-2xl border border-border/70 bg-card/70 p-2 shadow-2xl backdrop-blur-md">
      {/* moving sheen across the glass */}
      <div className="animate-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
      <div className="grid grid-cols-[8rem_1fr] overflow-hidden rounded-xl border border-border/60 bg-background/80 sm:grid-cols-[11rem_1fr]">
        {/* sidebar */}
        <aside className="hidden flex-col gap-1 border-r border-border/60 bg-sidebar/60 p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="grid size-5 place-items-center rounded-md bg-primary/15 text-primary">
              <HexagonIcon className="size-3" />
            </span>
            Acme HQ
          </div>
          {[
            { label: "general", active: true },
            { label: "design", active: false },
            { label: "engineering", active: false },
          ].map((c) => (
            <div
              key={c.label}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                c.active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground",
              )}
            >
              <HashIcon className="size-3" />
              {c.label}
            </div>
          ))}
          <div className="mt-3 mb-1 px-2 text-[10px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
            Direct messages
          </div>
          {["Mira", "Devon"].map((n) => (
            <div
              key={n}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {n}
            </div>
          ))}
        </aside>

        {/* conversation */}
        <div className="flex min-h-[20rem] flex-col">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <HashIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">general</span>
            <span className="ml-auto flex -space-x-1.5">
              {["bg-primary/30", "bg-accent/40", "bg-chart-4/40"].map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-5 rounded-full border-2 border-background",
                    c,
                  )}
                />
              ))}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <Bubble
              author="Mira"
              tone="muted"
              text="Anyone remember our refund window for annual plans?"
            />
            <Bubble
              author="Consect AI"
              tone="ai"
              text="Annual plans have a 30-day refund window — see “Billing Policy.pdf”, section 4."
            />
            <TypingBubble />
          </div>

          {/* composer */}
          <div className="m-3 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <SparklesIcon className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              Message #general — or ask the AI…
            </span>
            <span className="ml-auto grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <ArrowRightIcon className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  author,
  text,
  tone,
}: {
  author: string;
  text: string;
  tone: "muted" | "ai";
}) {
  return (
    <div className="flex gap-2.5">
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
          tone === "ai"
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {tone === "ai" ? <BotIcon className="size-3.5" /> : author[0]}
      </span>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium">{author}</span>
          {tone === "ai" && (
            <span className="rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-medium text-primary">
              AI
            </span>
          )}
        </div>
        <p
          className={cn(
            "max-w-sm rounded-lg px-3 py-1.5 text-xs leading-relaxed",
            tone === "ai"
              ? "bg-primary/5 text-foreground ring-1 ring-primary/15"
              : "bg-muted/60 text-foreground",
          )}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/** Someone is typing… animated dots. */
function TypingBubble() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
        D
      </span>
      <span className="flex items-center gap-1 rounded-lg bg-muted/60 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot size-1.5 rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base text-muted-foreground text-pretty">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="h-svh overflow-y-auto bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#ai-hub" className="transition-colors hover:text-foreground">
              AI Hub
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth">
                Get started
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <AnimatedBackdrop />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              AI-native team chat
            </span>
            <h1 className="font-heading mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Where your team talks — and your{" "}
              <span className="text-gradient">knowledge answers back</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              Consect blends real-time channels, DMs and groups with an AI Hub
              that answers from your own documents. Stop searching. Just ask.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/auth">
                  Start for free
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <a href="#ai-hub">See the AI Hub</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Bring your team in minutes
            </p>
          </Reveal>

          <Reveal delay={150} className="relative mx-auto mt-16 max-w-4xl">
            <ProductPreview />
          </Reveal>
        </div>

        {/* Marquee: source formats */}
        <div className="border-y border-border/60 bg-muted/20 py-5">
          <p className="mb-3 text-center text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
            Turns any source into answers
          </p>
          <div className="marquee-mask relative flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
              {[...SOURCE_TYPES, ...SOURCE_TYPES, ...SOURCE_TYPES].map((t, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <FileTextIcon className="size-4 text-primary" />
                  {t}
                </span>
              ))}
            </div>
            <div
              className="animate-marquee flex shrink-0 items-center gap-10 pr-10"
              aria-hidden
            >
              {[...SOURCE_TYPES, ...SOURCE_TYPES, ...SOURCE_TYPES].map((t, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <FileTextIcon className="size-4 text-primary" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 100}
              className="bg-card p-6 text-center"
            >
              <p className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Everything in one place"
            title="A workspace built for how teams actually talk"
            subtitle="Real-time messaging with the structure of channels and the intimacy of DMs — all in a fast, focused interface."
          />
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
          {PRIMARY_FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal
              key={title}
              delay={(i % 3) * 80}
              className="group relative bg-card p-6 transition-colors hover:bg-muted/30"
            >
              {/* hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              </div>
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="size-5" />
              </span>
              <h3 className="font-heading mt-4 text-base font-semibold">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AI Hub spotlight */}
      <section
        id="ai-hub"
        className="relative border-y border-border/60 bg-muted/20"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <BotIcon className="size-3.5" />
              The AI Hub
            </span>
            <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your team's knowledge, on call.
            </h2>
            <p className="mt-4 text-base text-muted-foreground text-pretty">
              Add the documents your work depends on and Consect turns them into
              an answer engine. Ask a question in any channel and get a grounded
              reply — cited from your own sources, scoped to who's allowed to see
              them.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {SOURCE_TYPES.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium"
                >
                  <FileTextIcon className="size-3.5 text-primary" />
                  {t}
                </span>
              ))}
            </div>

            <ul className="mt-8 space-y-4">
              {AI_HUB_POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* RAG flow illustration */}
          <Reveal
            delay={150}
            className="relative rounded-2xl border border-border/70 bg-card/70 p-6 shadow-xl backdrop-blur-sm"
          >
            <div className="animate-shimmer pointer-events-none absolute inset-0 rounded-2xl" />
            <div className="relative space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Indexed sources
              </p>
              {[
                { name: "Billing Policy.pdf", status: "Indexed" },
                { name: "Onboarding Guide.docx", status: "Indexed" },
                { name: "api-reference (URL)", status: "Indexed" },
              ].map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2.5"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <FileTextIcon className="size-4 text-primary" />
                  <span className="text-sm">{s.name}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckIcon className="size-3.5" />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative my-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <SparklesIcon className="size-3.5 animate-spin-slow text-primary" />
                vectorized &amp; searchable
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="relative rounded-xl bg-primary/5 p-4 ring-1 ring-primary/15">
              <p className="text-xs text-muted-foreground">You ask</p>
              <p className="mt-1 text-sm font-medium">
                “What's our refund window for annual plans?”
              </p>
              <div className="mt-3 flex gap-2.5 rounded-lg bg-background/80 p-3">
                <BotIcon className="size-4 shrink-0 text-primary" />
                <p className="text-sm">
                  Annual plans include a{" "}
                  <span className="font-medium">30-day refund window</span>.
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Source: Billing Policy.pdf · §4
                  </span>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Up and running fast"
            title="From empty workspace to answers in minutes"
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ step, title, body }, i) => (
            <Reveal
              key={step}
              delay={i * 120}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-xl"
            >
              <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
              <span className="font-heading relative text-4xl font-semibold text-primary/20">
                {step}
              </span>
              <h3 className="font-heading relative mt-2 text-lg font-semibold">
                {title}
              </h3>
              <p className="relative mt-2 text-sm text-muted-foreground">
                {body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border/60">
        <AnimatedBackdrop grid={false} />
        <Reveal className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <span className="animate-float mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <HexagonIcon className="size-6 fill-current/20" strokeWidth={2.25} />
          </span>
          <h2 className="font-heading mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Bring your team and your knowledge together.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground text-pretty">
            Start a workspace today — invite your team, add your docs, and let
            Consect handle the recall.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/auth">
                Get started — it's free
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Brand />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#ai-hub" className="hover:text-foreground">
              AI Hub
            </a>
            <Link href="/auth" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GlobeIcon className="size-3.5" />
            © {new Date().getFullYear()} Consect
          </p>
        </div>
      </footer>
    </div>
  );
}

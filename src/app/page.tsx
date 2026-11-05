import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HeroArt, Icon, SignatureArt } from "@/components/LandingArt";

const STEPS = [
  { icon: "login", title: "Sign up", body: "Create an account with your IUT email. Only allowed university domains can register." },
  { icon: "user", title: "Join a society", body: "Browse societies and request to join. The society admin approves you as a member." },
  { icon: "doc", title: "Draft an application", body: "The president, executives and sub-executives fill one event form: venue, dates, budget, purpose and support needed." },
  { icon: "check", title: "Multi-level approval", body: "It moves through the approval chain level by level. Each reviewer approves, rejects or asks for changes." },
  { icon: "calendar", title: "On the calendar", body: "Approved events appear on the public university calendar next to classes, exams and holidays." },
];

const CHAIN = [
  "President submits",
  "Society Moderator",
  "SCA Committee",
  "Student Welfare",
  "Pro-Vice Chancellor",
  "Vice Chancellor",
];

const FEATURES = [
  { icon: "building", title: "Society profiles", body: "Mission, vision, activities, achievements, gallery, reports and custom fields, all managed by the society." },
  { icon: "user", title: "Membership", body: "Students request to join; society admins approve or reject. Roles: admin, executive, sub-executive, member." },
  { icon: "doc", title: "Event applications", body: "One structured form covering venue, dates, participants, budget, funding, impact and partners." },
  { icon: "pen", title: "Signature and seal", body: "Reviewers stamp their signature and seal on approval. They are saved and reused next time." },
  { icon: "calendar", title: "Public calendar", body: "Academic periods, holidays, and approved or pending events in one view anyone can open." },
  { icon: "wallet", title: "Finance tracker", body: "Society admins record income and expenses. Moderators see charts and balances, read-only." },
  { icon: "printer", title: "Print-ready A4", body: "Every application has a clean A4 view with the current status and approval stamps." },
  { icon: "shield", title: "Role-based access", body: "Each person sees only what their role allows, enforced in the database, not just the interface." },
];

const ROLES = [
  { who: "Students", does: "Browse societies, request membership, check the calendar." },
  { who: "Presidents and executives", does: "Manage the profile, members and roles; draft and submit event applications; track approvals." },
  { who: "Moderators and reviewers", does: "See only the applications waiting at their level. Approve with signature and seal, reject, or request changes." },
  { who: "Super Admin", does: "Create societies, assign moderators and global roles, set allowed email domains, maintain the academic calendar." },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-[var(--brand-900)] py-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-100/90">
        <div className="mx-auto flex max-w-5xl justify-between px-4">
          <span>Islamic University of Technology · Society Management</span>
          <Link href="/calendar" className="hidden hover:text-white sm:inline">
            Calendar
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-[var(--brand-700)] text-white">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              IUT Society Portal
            </h1>
            <p className="mt-4 max-w-md text-emerald-50/90">
              Run a society end to end: members, profile, finances, and event applications
              that travel through every level of approval, with a record at each step.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-700)] hover:bg-emerald-50">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-md border border-white/70 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                Create account
              </Link>
              <Link href="/calendar" className="px-2 py-2.5 text-sm font-semibold text-white underline underline-offset-4">
                View calendar
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">How it works</p>
        <h2 className="mb-10 mt-1 font-serif text-3xl font-semibold">From sign-up to approved event</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-xl border bg-white p-4">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-from)]">
                <Icon name={s.icon} />
              </span>
              <p className="font-mono text-[10px] text-gray-400">STEP {i + 1}</p>
              <h3 className="mb-1 font-serif text-base font-semibold">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Approval chain */}
      <section className="bg-[var(--accent-soft)]">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">Approval workflow</p>
            <h2 className="mb-3 mt-1 font-serif text-3xl font-semibold">A clear chain, every decision on record</h2>
            <p className="mb-5 text-gray-700">
              Each society sets the chain per application type, and it is locked when an
              application is submitted. Reviewers only see applications waiting at their
              level. Every action keeps a comment, a timestamp and the reviewer&apos;s
              signature and seal.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>Approve</strong> moves it to the next level, or finishes it.</li>
              <li><strong>Request changes</strong> sends it back to the society. After edits it restarts at level 1.</li>
              <li><strong>Reject</strong> closes the application for good.</li>
            </ul>
          </div>
          <div className="flex flex-col items-center gap-6">
            <ol className="w-full max-w-sm">
              {CHAIN.map((c, i) => (
                <li key={c} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === 0 ? "bg-white text-[var(--accent-from)] ring-2 ring-[var(--accent-from)]" : "bg-[var(--accent-from)] text-white"}`}>
                      {i === 0 ? "★" : i}
                    </span>
                    {i < CHAIN.length - 1 && <span className="h-5 w-px bg-[var(--accent-from)]/40" />}
                  </div>
                  <p className="pt-1 text-sm font-medium">{c}</p>
                </li>
              ))}
            </ol>
            <SignatureArt />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">What is inside</p>
        <h2 className="mb-10 mt-1 font-serif text-3xl font-semibold">Everything a society needs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-white p-5">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-from)]">
                <Icon name={f.icon} />
              </span>
              <h3 className="mb-1 font-serif text-base font-semibold">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-y border-[var(--card-border)] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">Who uses it</p>
          <h2 className="mb-8 mt-1 font-serif text-3xl font-semibold">One portal, four kinds of user</h2>
          <dl className="grid gap-px overflow-hidden rounded-xl border bg-[var(--card-border)] sm:grid-cols-2">
            {ROLES.map((r) => (
              <div key={r.who} className="bg-white p-5">
                <dt className="mb-1 font-serif text-lg font-semibold text-[var(--accent-from)]">{r.who}</dt>
                <dd className="text-sm text-gray-600">{r.does}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--brand-700)] text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          <h2 className="font-serif text-3xl font-semibold">Ready to get started?</h2>
          <p className="mx-auto mt-2 max-w-md text-emerald-50/90">Sign in with your IUT account, or look at what is coming up first.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-700)] hover:bg-emerald-50">
              Create account
            </Link>
            <Link href="/calendar" className="rounded-md border border-white/70 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              View calendar
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto bg-[var(--brand-900)] px-4 py-6 text-center text-xs text-emerald-100/80">
        Islamic University of Technology (OIC), Board Bazar, Gazipur-1704
      </footer>
    </main>
  );
}

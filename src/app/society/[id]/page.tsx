import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isSocietyStaff } from "@/lib/auth";

type Winner = { name: string; detail?: string };
type CalendarEvent = {
  id: string;
  society_id: string;
  title: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  status: "submitted" | "approved";
};

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function SocietyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [
    { data: society },
    { data: profile },
    { data: activities },
    { data: achievements },
    { data: gallery },
    { data: reports },
    { data: customFields },
    { data: events },
  ] = await Promise.all([
    supabase.from("societies").select("*").eq("id", id).single(),
    supabase.from("profile_sections").select("*").eq("society_id", id).maybeSingle(),
    supabase.from("activities").select("*").eq("society_id", id).order("created_at", { ascending: false }),
    supabase.from("achievements").select("*").eq("society_id", id).order("created_at", { ascending: false }),
    supabase.from("gallery_images").select("*").eq("society_id", id),
    supabase.from("reports").select("*").eq("society_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("custom_fields").select("*").eq("society_id", id).order("sort_order"),
    supabase.rpc("calendar_events"),
  ]);

  if (!society) notFound();

  const isStaff = isSocietyStaff(user, id);
  const canManage = isStaff || user.globalRoles.includes("super_admin");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = ((events ?? []) as CalendarEvent[])
    .filter((e) => e.society_id === id && e.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <header className="card mb-6 flex flex-wrap items-center justify-between gap-4 !p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-700)] font-serif text-2xl font-semibold text-white">
            {society.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{society.name}</h1>
            {society.description && (
              <p className="mt-1 max-w-xl text-sm text-gray-600">{society.description}</p>
            )}
          </div>
        </div>
        {canManage && (
          <Link href={`/society/${id}/manage`} className="btn btn-primary">
            Manage society
          </Link>
        )}
      </header>

      {(profile?.mission || profile?.vision) && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {profile?.mission && (
            <div className="rounded-xl bg-[var(--accent-soft)] p-5">
              <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">Mission</p>
              <p className="text-sm leading-relaxed text-gray-800">{profile.mission}</p>
            </div>
          )}
          {profile?.vision && (
            <div className="rounded-xl bg-[var(--accent-soft)] p-5">
              <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-[var(--accent-from)]">Vision</p>
              <p className="text-sm leading-relaxed text-gray-800">{profile.vision}</p>
            </div>
          )}
        </section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming events">
          <ul className="flex flex-col gap-2">
            {upcoming.map((e) => (
              <li key={e.id} className="card flex items-center justify-between gap-3 !py-3">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-gray-500">
                    {fmtDate(e.start_date)}
                    {e.end_date !== e.start_date && ` – ${fmtDate(e.end_date)}`}
                    {e.venue && ` · ${e.venue}`}
                  </p>
                </div>
                <span className={`badge ${e.status === "submitted" ? "!bg-amber-100 !text-amber-900" : ""}`}>
                  {e.status === "approved" ? "Approved" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(activities?.length ?? 0) > 0 && (
        <Section title="Activities">
          <div className="grid gap-4 sm:grid-cols-2">
            {activities!.map((a) => (
              <PostCard key={a.id} title={a.title} description={a.description} images={a.images} />
            ))}
          </div>
        </Section>
      )}

      {(achievements?.length ?? 0) > 0 && (
        <Section title="Achievements">
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements!.map((a) => (
              <PostCard
                key={a.id}
                title={a.title}
                description={a.description}
                images={a.images}
                winners={Array.isArray(a.winners) ? (a.winners as Winner[]) : []}
              />
            ))}
          </div>
        </Section>
      )}

      {(gallery?.length ?? 0) > 0 && (
        <Section title="Gallery">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {gallery!.map((g) => (
              <figure key={g.id} className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image_url} alt={g.caption ?? ""} className="aspect-square w-full object-cover" />
                {g.caption && <figcaption className="px-3 py-2 text-xs text-gray-600">{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </Section>
      )}

      {(reports?.length ?? 0) > 0 && (
        <Section title="Reports">
          <ul className="flex flex-col gap-2">
            {reports!.map((r) => (
              <li key={r.id}>
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="card flex items-center justify-between gap-3 !py-3 hover:border-[var(--accent-from)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] font-mono text-[10px] font-semibold text-[var(--accent-from)]">
                      PDF
                    </span>
                    <span className="text-sm font-medium">{r.title}</span>
                  </span>
                  <span className="text-xs text-gray-500">{new Date(r.uploaded_at).toLocaleDateString("en-GB")}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(customFields?.length ?? 0) > 0 && (
        <Section title="More about us">
          <dl className="card grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {customFields!.map((f) => (
              <div key={f.id}>
                <dt className="font-mono text-[11px] uppercase tracking-wide text-gray-500">{f.label}</dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {f.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.value ?? ""} alt={f.label} className="max-w-xs rounded-md" />
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {!profile?.mission &&
        !profile?.vision &&
        !activities?.length &&
        !achievements?.length &&
        !gallery?.length &&
        !reports?.length && (
          <p className="rounded-xl border border-dashed border-[var(--card-border)] px-4 py-12 text-center text-sm text-gray-500">
            This society has not added a profile yet.
            {canManage && (
              <>
                {" "}
                <Link href={`/society/${id}/manage/profile`} className="underline">
                  Add profile content
                </Link>
              </>
            )}
          </p>
        )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-serif text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PostCard({
  title,
  description,
  images,
  winners,
}: {
  title: string;
  description: string | null;
  images: string[] | null;
  winners?: Winner[];
}) {
  const cover = images?.[0];
  const rest = images?.slice(1, 4) ?? [];
  return (
    <article className="card overflow-hidden !p-0">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm leading-relaxed text-gray-700">{description}</p>}
        {winners && winners.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {winners.map((w, i) => (
              <span key={i} className="badge">
                ★ {w.detail ? `${w.name} (${w.detail})` : w.name}
              </span>
            ))}
          </div>
        )}
        {rest.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {rest.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-square rounded-md object-cover" />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

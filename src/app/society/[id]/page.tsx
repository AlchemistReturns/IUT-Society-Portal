import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

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
  ] = await Promise.all([
    supabase.from("societies").select("*").eq("id", id).single(),
    supabase.from("profile_sections").select("*").eq("society_id", id).maybeSingle(),
    supabase
      .from("activities")
      .select("*")
      .eq("society_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("achievements")
      .select("*")
      .eq("society_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("gallery_images").select("*").eq("society_id", id),
    supabase
      .from("reports")
      .select("*")
      .eq("society_id", id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("custom_fields")
      .select("*")
      .eq("society_id", id)
      .order("sort_order"),
  ]);

  if (!society) notFound();

  const staffRoles = ["admin", "executive", "sub_executive"];
  const isStaff = user.societyRoles.some(
    (r) => r.societyId === id && staffRoles.includes(r.role)
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{society.name}</h1>
          {society.description && (
            <p className="text-sm text-gray-600">{society.description}</p>
          )}
        </div>
        <div className="flex gap-4 text-sm">
          {isStaff && (
            <Link href={`/society/${id}/manage`} className="underline">
              Manage
            </Link>
          )}
          <Link href="/societies" className="underline">
            All societies
          </Link>
        </div>
      </div>

      {(profile?.mission || profile?.vision) && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {profile?.mission && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h2 className="mb-1 font-medium">Mission</h2>
              <p className="text-sm text-gray-700">{profile.mission}</p>
            </div>
          )}
          {profile?.vision && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h2 className="mb-1 font-medium">Vision</h2>
              <p className="text-sm text-gray-700">{profile.vision}</p>
            </div>
          )}
        </section>
      )}

      <Section title="Activities">
        {(activities ?? []).map((a) => (
          <Card key={a.id} title={a.title} description={a.description} images={a.images} />
        ))}
      </Section>

      <Section title="Achievements">
        {(achievements ?? []).map((a) => (
          <Card
            key={a.id}
            title={a.title}
            description={a.description}
            images={a.images}
            extra={
              Array.isArray(a.winners) && a.winners.length > 0 ? (
                <p className="mt-1 text-xs text-gray-500">
                  Winners:{" "}
                  {a.winners
                    .map((w: { name: string; detail?: string }) =>
                      w.detail ? `${w.name} (${w.detail})` : w.name
                    )
                    .join(", ")}
                </p>
              ) : null
            }
          />
        ))}
      </Section>

      <Section title="Gallery">
        {(gallery?.length ?? 0) > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gallery!.map((g) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={g.id}
                src={g.image_url}
                alt={g.caption ?? ""}
                className="aspect-square rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Reports">
        <ul className="flex flex-col gap-1">
          {(reports ?? []).map((r) => (
            <li key={r.id} className="text-sm">
              <a href={r.file_url} className="underline" target="_blank" rel="noreferrer">
                {r.title}
              </a>{" "}
              <span className="text-gray-400">
                — {new Date(r.uploaded_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {(customFields?.length ?? 0) > 0 && (
        <Section title="More">
          {customFields!.map((f) => (
            <div key={f.id} className="mb-3">
              <h3 className="text-sm font-medium">{f.label}</h3>
              {f.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.value ?? ""} alt={f.label} className="mt-1 max-w-xs rounded-md" />
              ) : (
                <p className="text-sm text-gray-700">{f.value}</p>
              )}
            </div>
          ))}
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Card({
  title,
  description,
  images,
  extra,
}: {
  title: string;
  description: string | null;
  images: string[] | null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-sm text-gray-700">{description}</p>}
      {extra}
      {(images?.length ?? 0) > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images!.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="aspect-square rounded-md object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

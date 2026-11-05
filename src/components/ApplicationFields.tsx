import { SUPPORT_OPTIONS, type ApplicationDetails } from "@/lib/application-fields";

const input = "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-gray-500">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

export default function ApplicationFields({
  values,
}: {
  values?: {
    title?: string;
    venue?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    details?: ApplicationDetails;
  };
}) {
  const d = values?.details ?? {};
  const support = d.support ?? ["permission"];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event name">
          <input name="title" required defaultValue={values?.title} placeholder="e.g. IUT Career Fest 2027" className={input} />
        </Field>
        <Field label="Venue">
          <input name="venue" defaultValue={values?.venue ?? ""} placeholder="e.g. IUT Auditorium" className={input} />
        </Field>
        <Field label="Start date">
          <input type="date" name="start_date" defaultValue={values?.start_date ?? ""} className={input} />
        </Field>
        <Field label="End date" hint="same as start for one-day">
          <input type="date" name="end_date" defaultValue={values?.end_date ?? ""} className={input} />
        </Field>
        <Field label="Time">
          <input name="time" defaultValue={d.time} placeholder="e.g. 9:00 AM – 5:00 PM" className={input} />
        </Field>
        <Field label="Expected participants">
          <input name="participants" defaultValue={d.participants} placeholder="e.g. 300 students, 12 companies" className={input} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Support requested</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {SUPPORT_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="support"
                value={o.value}
                defaultChecked={support.includes(o.value)}
                className="accent-[var(--accent-from)]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Purpose and student benefit">
        <textarea name="purpose" rows={3} defaultValue={d.purpose ?? d.description} placeholder="One concise paragraph: purpose, scale, expected benefit to students" className={input} />
      </Field>
      <Field label="Logistical requirements" hint="only if requesting logistical support">
        <textarea name="logistics" rows={3} defaultValue={d.logistics} placeholder="(a) auditorium/rooms; (b) projector and microphone; (c) transport; …" className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Total budget (BDT)">
          <input type="number" min="0" name="budget_total" defaultValue={d.budget_total} className={input} />
        </Field>
        <Field label="Secured (BDT)">
          <input type="number" min="0" name="budget_secured" defaultValue={d.budget_secured} className={input} />
        </Field>
        <Field label="Requested from IUT (BDT)">
          <input type="number" min="0" name="budget_requested" defaultValue={d.budget_requested} className={input} />
        </Field>
      </div>

      <Field label="Funding sources">
        <input name="funding_sources" defaultValue={d.funding_sources} className={input} />
      </Field>
      <Field label="Impact on student development & IUT's visibility">
        <textarea name="impact" rows={3} defaultValue={d.impact} className={input} />
      </Field>
      <Field label="Partner organization" hint="if any — corporate proposals also need the official e-mail to the VC attached">
        <input name="partner" defaultValue={d.partner} className={input} />
      </Field>
    </div>
  );
}

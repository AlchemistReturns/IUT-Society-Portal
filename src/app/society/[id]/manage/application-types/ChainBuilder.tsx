"use client";

import { useState } from "react";
import { createApplicationType } from "./actions";

const ENTITIES = [
  { value: "society_moderator", label: "Society Moderator" },
  { value: "department_head", label: "Department Head" },
  { value: "sca_committee", label: "Social and Cultural Affairs Committee" },
  { value: "student_welfare", label: "Office of Student Welfare" },
  { value: "pro_vc", label: "Pro-Vice Chancellor" },
  { value: "vc", label: "Vice Chancellor" },
];

export function ChainBuilder({ societyId }: { societyId: string }) {
  const [levels, setLevels] = useState<string[]>(["society_moderator"]);

  return (
    <form action={createApplicationType} className="flex flex-col gap-4">
      <input type="hidden" name="society_id" value={societyId} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Type name
        <input name="name" placeholder="e.g. Event, Permission, Logistic support" required className="input" />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium">Approval chain</p>
        <div className="flex flex-col">
          {levels.map((level, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-from)] text-xs font-semibold text-white">
                  {i + 1}
                </span>
                {i < levels.length - 1 && <span className="w-px flex-1 bg-[var(--card-border)]" />}
              </div>
              <div className="mb-3 flex flex-1 items-center gap-2">
                <select
                  name="entity"
                  value={level}
                  onChange={(e) => {
                    const next = [...levels];
                    next[i] = e.target.value;
                    setLevels(next);
                  }}
                  className="input"
                >
                  {ENTITIES.map((ent) => (
                    <option key={ent.value} value={ent.value}>
                      {ent.label}
                    </option>
                  ))}
                </select>
                {levels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLevels(levels.filter((_, idx) => idx !== i))}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setLevels([...levels, "society_moderator"])}
          className="btn btn-outline"
        >
          + Add level
        </button>
        <button className="btn btn-primary">Create application type</button>
      </div>
    </form>
  );
}

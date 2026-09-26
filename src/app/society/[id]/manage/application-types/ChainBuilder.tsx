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
    <form action={createApplicationType} className="flex flex-col gap-3 sm:max-w-lg">
      <input type="hidden" name="society_id" value={societyId} />
      <input name="name" placeholder="Application type name" required className="rounded-md border px-3 py-2 text-sm" />

      <div className="flex flex-col gap-2">
        {levels.map((level, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-xs text-gray-400">{i + 1}.</span>
            <select
              name="entity"
              value={level}
              onChange={(e) => {
                const next = [...levels];
                next[i] = e.target.value;
                setLevels(next);
              }}
              className="w-full rounded-md border px-2 py-1 text-sm"
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
                className="text-xs text-red-600 underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setLevels([...levels, "society_moderator"])}
        className="w-fit rounded-md border px-3 py-1 text-xs"
      >
        Add level
      </button>

      <button className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
        Create application type
      </button>
    </form>
  );
}

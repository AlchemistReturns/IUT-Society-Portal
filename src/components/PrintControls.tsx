"use client";

import { useEffect } from "react";

// Opens the browser print dialog. With `auto`, it fires once on load so the
// "Print" link on the application page goes straight to the dialog.
export default function PrintControls({ auto }: { auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // Let fonts and signature images settle before the dialog snapshots the page.
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mb-4 rounded-md bg-[var(--brand-700)] px-4 py-2 font-sans text-sm font-semibold text-white hover:opacity-90 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("flash");
    url.searchParams.delete("flash_type");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);

    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
        type === "error" ? "bg-red-600" : "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]"
      }`}
    >
      {message}
    </div>
  );
}

function FlashToastWatcher() {
  const searchParams = useSearchParams();
  const flash = searchParams.get("flash");
  const type = searchParams.get("flash_type") === "error" ? "error" : "success";

  if (!flash) return null;

  // Remount on every distinct flash so the auto-hide timer restarts cleanly.
  return <Toast key={`${flash}:${type}`} message={flash} type={type} />;
}

export default function FlashToast() {
  return (
    <Suspense fallback={null}>
      <FlashToastWatcher />
    </Suspense>
  );
}

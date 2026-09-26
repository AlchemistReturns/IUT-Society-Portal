"use client";

import { useEffect, useState } from "react";

export default function FlashToastClient({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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

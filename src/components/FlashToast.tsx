import { cookies } from "next/headers";
import FlashToastClient from "./FlashToastClient";

function parseFlash(raw: string): { message: string; type: "success" | "error" } | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function FlashToast() {
  const store = await cookies();
  const raw = store.get("flash")?.value;
  if (!raw) return null;

  const parsed = parseFlash(raw);
  if (!parsed) return null;

  return <FlashToastClient message={parsed.message} type={parsed.type} />;
}

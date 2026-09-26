import { redirect } from "next/navigation";

// Server-action helper: call after a mutation to bounce back to `path` with
// a one-shot flash message, rendered by <FlashToast/> in the root layout.
export function flashRedirect(path: string, message: string, type: "success" | "error" = "success"): never {
  const url = new URL(path, "http://internal");
  url.searchParams.set("flash", message);
  url.searchParams.set("flash_type", type);
  redirect(`${url.pathname}${url.search}`);
}

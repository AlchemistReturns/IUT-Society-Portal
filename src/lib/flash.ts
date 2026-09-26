import { cookies } from "next/headers";

// Cookie-based flash message: survives redirects reliably and doesn't
// depend on the client picking up a query-string-only URL change (which
// Next's router does not consistently surface via useSearchParams when the
// pathname is unchanged). Read back by <FlashToast/> in the root layout.
export async function setFlash(message: string, type: "success" | "error" = "success") {
  const store = await cookies();
  store.set("flash", JSON.stringify({ message, type }), {
    path: "/",
    maxAge: 5,
  });
}

import { createBrowserClient } from "@supabase/ssr";
// TODO: once the schema is deployed, run
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// and parameterize these clients with <Database> for full query typing.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

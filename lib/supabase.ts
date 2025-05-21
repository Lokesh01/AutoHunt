import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

interface Cookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

export const createClient = (
  cookieStore: ReturnType<typeof cookies> | Awaited<ReturnType<typeof cookies>>
) => {
  // Normalize to handle both direct and Promise-wrapped cookie stores
  const resolvedCookieStore =
    "then" in cookieStore ? cookieStore : Promise.resolve(cookieStore);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => {
          const store = await resolvedCookieStore;
          return store.getAll();
        },
        setAll: async (cookiesToSet: Cookie[]) => {
          try {
            const store = await resolvedCookieStore;
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
};

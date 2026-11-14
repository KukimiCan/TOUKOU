import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/database.types";
import { isTrialExpired } from "@/features/auth/trial";
import { getSupabaseEnv } from "@/lib/supabase/env";

// ログインしていなくても開けるページ。API は、それぞれの route が 401 を返す。
function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/api/")
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
        if (cookiesToSet.length > 0 && !response.headers.has("Cache-Control")) {
          response.headers.set("Cache-Control", "private, no-store");
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  // 期限を過ぎた体験用アカウントは、ログインしていない扱いにする（#216）
  const loggedIn =
    Boolean(data?.claims) && !isTrialExpired(data?.claims.app_metadata);

  if (!loggedIn && !isPublicPath(request.nextUrl.pathname)) {
    // 途中で付いた cookie（セッションの更新など）を、転送先の応答にも渡す
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    if (response.cookies.getAll().length > 0) {
      redirect.headers.set(
        "Cache-Control",
        response.headers.get("Cache-Control") ?? "private, no-store",
      );
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 요청 호스트에서 서브도메인을 추출합니다 */
function parseSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]; // 포트 제거
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";

  // 프로덕션: brand-a.qubuilder.com
  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const sub = host.slice(0, -(rootDomain.length + 1));
    if (sub && sub !== "www") return sub;
  }

  // 로컬 개발: brand-a.localhost
  if (process.env.NODE_ENV === "development" && host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (sub) return sub;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const orgSlug = parseSubdomain(hostname);

  // 서브도메인일 때 x-org-slug 헤더 추가
  const requestHeaders = new Headers(request.headers);
  if (orgSlug) {
    requestHeaders.set("x-org-slug", orgSlug);
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 서브도메인에서 /admin 접근 차단
  if (orgSlug && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 메인 도메인: /admin은 로그인 필요
  if (!orgSlug && request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 이미 로그인한 사용자가 /login 접근 시
  if (!orgSlug && request.nextUrl.pathname === "/login" && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/tests";
    return NextResponse.redirect(adminUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

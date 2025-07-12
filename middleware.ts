import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "./lib/supabase/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Výjimky - stránky které nepotřebují autentifikaci
  const publicPaths = ["/auth/signin", "/auth/signup", "/auth/error", "/unauthorized"];
  
  if (publicPaths.includes(url.pathname)) {
    return NextResponse.next();
  }

  // Všechny ostatní stránky vyžadují autentifikaci
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Pokud není přihlášený nebo je chyba, přesměruj na přihlášení
    if (error || !user) {
      console.log("Admin access denied - no user or error:", error?.message);
      url.pathname = "/auth/signin";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    console.log("Admin access allowed for user:", user.email);

    // Dočasně vypneme kontrolu role pro testování
    // TODO: Zapnout až bude databáze připravena
    /*
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData && userData.role !== 'admin' && userData.role !== 'editor') {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
    */

  } catch (error) {
    console.error("Admin middleware error:", error);
    url.pathname = "/auth/signin";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

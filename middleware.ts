import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Veřejné cesty - nepotřebují autentizaci
  const publicPaths = [
    "/auth/signin", 
    "/auth/signup", 
    "/auth/error", 
    "/auth/confirm",
    "/unauthorized"
  ];
  
  if (publicPaths.includes(url.pathname)) {
    return NextResponse.next();
  }

  // API routes - rozdělení na veřejné a chráněné
  if (url.pathname.startsWith("/api/")) {
    // Veřejné API routes - žádná autentifikace
    if (
      url.pathname.startsWith("/api/stripe/") || 
      url.pathname.startsWith("/api/packeta/") ||
      url.pathname.startsWith("/api/auth/")
    ) {
      return NextResponse.next();
    }
    
    // Admin API routes - vyžadují Supabase autentizaci
    if (url.pathname.startsWith("/api/admin/")) {
      return await updateSession(request);
    }
    
    // Ostatní API routes - bez autentizace
    return NextResponse.next();
  }

  // Všechny ostatní stránky (admin rozhraní) vyžadují autentizaci
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

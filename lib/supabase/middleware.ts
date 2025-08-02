import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}

export async function updateSession(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  try {
    const { supabase, response } = createClient(request);
    
    // Obnovení session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Pokud není přihlášený uživatel nebo je chyba
    if (error || !user) {
      console.log("Přesměrování na přihlášení - chyba nebo žádný uživatel:", error?.message);
      url.pathname = "/auth/signin";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    console.log("Autentizovaný uživatel:", user.email);

    // TODO: Zde můžeš přidat kontrolu rolí z databáze
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();
    // 
    // if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    //   url.pathname = "/unauthorized";
    //   return NextResponse.redirect(url);
    // }

    return response;
  } catch (error) {
    console.error("Middleware chyba:", error);
    url.pathname = "/auth/signin";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

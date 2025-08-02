import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Public API for products (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST method not allowed for public API
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed. Use admin API for creating products." },
    { status: 405 }
  );
}

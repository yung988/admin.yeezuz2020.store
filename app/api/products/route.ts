import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // Validace požadovaných polí
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: "Název a cena jsou povinné" },
        { status: 400 }
      );
    }

    // Příprava dat pro vložení
    const productData = {
      name: body.name,
      description: body.description || null,
      price: parseInt(body.price) || 0, // Převod na haléře
      category: body.category || null,
      sku: body.sku || null,
      status: body.status || "active"
    };

    // Vytvoření produktu
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (productError) {
      return NextResponse.json(
        { error: productError.message },
        { status: 400 }
      );
    }

    // Vytvoření variant pokud jsou poskytnuty
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      const variants = body.variants.map((variant: any) => ({
        product_id: product.id,
        size: variant.size,
        sku: variant.sku || `${product.sku || product.id}-${variant.size}`,
        stock_quantity: parseInt(variant.stock) || 0,
        price_override: variant.price_override ? parseInt(variant.price_override) : null
      }));

      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(variants);

      if (variantsError) {
        console.error("Error creating variants:", variantsError);
        // Nebudeme mazat produkt, jen zalogujeme chybu
      }
    }

    // Načtení kompletního produktu s variantami
    const { data: completeProduct, error: fetchError } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .eq("id", product.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(completeProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Chyba při vytváření produktu" },
      { status: 500 }
    );
  }
}

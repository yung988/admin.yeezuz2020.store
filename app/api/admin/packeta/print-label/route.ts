import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Authenticate admin request
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    // Získat objednávku z databáze
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.packeta_label_id) {
      return NextResponse.json({ error: "No Packeta label available" }, { status: 404 });
    }

    // Získat štítek z Packeta API
    const response = await fetch(
      `https://api.packeta.com/v6/packets/${order.packeta_label_id}/label`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PACKETA_API_KEY}`,
          Accept: "application/pdf",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch label from Packeta");
    }

    const pdfBuffer = await response.arrayBuffer();

    // Vrátit PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="packeta-${order.order_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error fetching Packeta label:", error);
    return NextResponse.json({ error: "Failed to fetch label" }, { status: 500 });
  }
}
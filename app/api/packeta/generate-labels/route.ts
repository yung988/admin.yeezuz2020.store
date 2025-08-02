import { NextRequest, NextResponse } from 'next/server';
import { generateMultipleLabels } from '@/lib/packeta';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { date, orderIds } = await request.json();
    
    const supabase = await createClient();
    
    let query = supabase
      .from('orders')
      .select('id, packeta_label_id, order_number, customer_name')
      .not('packeta_label_id', 'is', null);

    // Pokud jsou zadána konkrétní ID objednávek
    if (orderIds && orderIds.length > 0) {
      query = query.in('id', orderIds);
    } 
    // Jinak vyber podle data
    else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Chyba při načítání objednávek:', error);
      return NextResponse.json({ error: 'Chyba při načítání objednávek' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Nebyly nalezeny žádné objednávky s Packeta štítky' }, { status: 404 });
    }

    // Získej všechny label ID
    const labelIds = orders
      .filter(order => order.packeta_label_id)
      .map(order => order.packeta_label_id);

    if (labelIds.length === 0) {
      return NextResponse.json({ error: 'Žádné štítky k vygenerování' }, { status: 404 });
    }

    // Vygeneruj PDF se štítky
    const labelsResponse = await generateMultipleLabels(labelIds);

    // Vytvoř response s PDF
    const pdfBuffer = Buffer.from(labelsResponse.pdf, 'base64');
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="packeta-labels-${date || 'selected'}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Chyba při generování štítků:', error);
    return NextResponse.json({ 
      error: `Chyba při generování štítků: ${error.message}` 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: 'Datum je povinné' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Získej objednávky s Packeta štítky pro daný den
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, customer_email, packeta_label_id, packeta_pickup_point_name, created_at, packeta_printed, packeta_printed_at')
      .not('packeta_label_id', 'is', null)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Chyba při načítání objednávek:', error);
      return NextResponse.json({ error: 'Chyba při načítání objednávek' }, { status: 500 });
    }

    return NextResponse.json({ 
      orders: orders || [],
      count: orders?.length || 0
    });

  } catch (error: any) {
    console.error('Chyba při načítání objednávek:', error);
    return NextResponse.json({ 
      error: `Chyba při načítání objednávek: ${error.message}` 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createPacketaShipment } from '@/lib/packeta';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID je povinný' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Získej data objednávky ze Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Chyba při načítání objednávky:', error);
      return NextResponse.json({ error: 'Objednávka nenalezena' }, { status: 404 });
    }

    if (!order.packeta_pickup_point_id) {
      return NextResponse.json({ error: 'Objednávka nemá vybrané výdejní místo Packeta' }, { status: 400 });
    }

    if (order.packeta_label_id) {
      return NextResponse.json({ error: 'Zásilka už byla vytvořena' }, { status: 400 });
    }

    // Rozdělení jména na jméno a příjmení
    const nameParts = order.customer_name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Vytvoř zásilku v Packeta
    const shipment = await createPacketaShipment({
      orderNumber: order.order_number || order.id,
      customerName: firstName,
      customerSurname: lastName,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || '',
      pickupPointId: order.packeta_pickup_point_id,
      cashOnDelivery: 0, // Pokud máte dobírku, upravte podle potřeby
      orderValue: order.total_amount,
      weight: 1000, // Výchozí váha 1kg, upravte podle potřeby
    });

    // Ulož tracking info do Supabase
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        packeta_label_id: shipment.id,
        packeta_tracking_number: shipment.barcode,
        status: order.status === 'pending' ? 'processing' : order.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Chyba při aktualizaci objednávky:', updateError);
      return NextResponse.json({ error: 'Chyba při ukládání tracking informací' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      shipment,
      message: 'Zásilka byla úspěšně vytvořena'
    });

  } catch (error: any) {
    console.error('Chyba při vytváření zásilky:', error);
    return NextResponse.json({ 
      error: `Chyba při vytváření zásilky: ${error.message}` 
    }, { status: 500 });
  }
}

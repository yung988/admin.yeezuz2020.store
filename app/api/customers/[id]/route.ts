import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const customerId = params.id;

    // Načtení detailu zákazníka s agregovanými daty
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:orders(
          id,
          total_amount,
          status,
          created_at
        )
      `)
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Chyba při načítání zákazníka:', error);
      return NextResponse.json(
        { error: 'Zákazník nenalezen' },
        { status: 404 }
      );
    }

    // Výpočet agregovaných dat
    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum: number, order: any) => sum + order.total_amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Posledních 5 objednávek
    const recentOrders = customer.orders
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Statistiky podle statusů
    const statusStats = customer.orders.reduce((stats: any, order: any) => {
      stats[order.status] = (stats[order.status] || 0) + 1;
      return stats;
    }, {});

    const customerDetail = {
      ...customer,
      orders: undefined, // Odebereme pole orders z hlavního objektu
      stats: {
        totalOrders,
        totalSpent,
        averageOrderValue,
        statusStats
      },
      recentOrders
    };

    return NextResponse.json(customerDetail);
  } catch (error) {
    console.error('Chyba při načítání detailu zákazníka:', error);
    return NextResponse.json(
      { error: 'Interní chyba serveru' },
      { status: 500 }
    );
  }
}

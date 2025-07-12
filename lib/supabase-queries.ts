import { createClient } from "@/lib/supabase/client";

export async function getDashboardMetrics() {
  const supabase = createClient();
  
  try {
    // Celkové tržby
    const { data: totalRevenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid');
    
    const totalRevenue = totalRevenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    
    // Objednávky dnes
    const today = new Date().toISOString().split('T')[0];
    const { data: todayOrdersData } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', today);
    
    // Objednávky tento měsíc
    const thisMonth = new Date().toISOString().slice(0, 7);
    const { data: monthlyOrdersData } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', thisMonth);
    
    // Celkový počet produktů
    const { data: productsData } = await supabase
      .from('products')
      .select('id')
      .eq('status', 'active');
    
    // Produkty s nízkými zásobami (stock < 5)
    const { data: lowStockData } = await supabase
      .from('product_variants')
      .select('id')
      .lt('stock_quantity', 5);
    
    return {
      totalRevenue,
      todayOrders: todayOrdersData?.length || 0,
      monthlyOrders: monthlyOrdersData?.length || 0,
      totalProducts: productsData?.length || 0,
      lowStock: lowStockData?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      totalRevenue: 0,
      todayOrders: 0,
      monthlyOrders: 0,
      totalProducts: 0,
      lowStock: 0,
    };
  }
}

export async function getRecentOrders() {
  const supabase = createClient();
  
  try {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return data || [];
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
}

export async function getSalesData() {
  const supabase = createClient();
  
  try {
    // Posledních 7 dní
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });
    
    // Seskupení dat podle dne
    const salesByDay = data?.reduce((acc, order) => {
      const date = order.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, sales: 0 };
      }
      acc[date].sales += order.total_amount;
      return acc;
    }, {} as Record<string, { date: string; sales: number }>);
    
    return Object.values(salesByDay || {});
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
}

import { createClient } from "@/lib/supabase/server";

// Database types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  sku: string | null;
  status: string;
  stripe_product_id: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  sku: string;
  stock_quantity: number;
  price_override: number | null;
  stripe_price_id: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  shipping_method: string | null;
  shipping_cost: number | null;
  shipping_address: any;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  order_notes: string | null;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

// Product queries
export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Product[];
}

export async function getProductsWithVariants() {
  const supabase = await createClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      *,
      product_variants (*),
      product_images (*)
    `)
    .order("created_at", { ascending: false });

  if (productsError) throw productsError;
  return products;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_variants (*),
      product_images (*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// Order queries
export async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Order[];
}

export async function getOrdersWithItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (*),
        product_variants (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getDashboardMetrics() {
  const supabase = await createClient();
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("payment_status", "paid");

    if (revenueError) throw revenueError;

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    // Orders today
    const { data: todayOrdersData, error: todayOrdersError } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", startOfDay);

    if (todayOrdersError) throw todayOrdersError;

    const todayOrders = todayOrdersData?.length || 0;

    // Orders this month
    const { data: monthlyOrdersData, error: monthlyOrdersError } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", startOfMonth);

    if (monthlyOrdersError) throw monthlyOrdersError;

    const monthlyOrders = monthlyOrdersData?.length || 0;

    // Total products
    const { data: productsData, error: productsError } = await supabase.from("products").select("id");

    if (productsError) throw productsError;

    const totalProducts = productsData?.length || 0;

    // Low stock products (less than 5 units)
    const { data: variantsData, error: variantsError } = await supabase
      .from("product_variants")
      .select("product_id, stock_quantity")
      .lt("stock_quantity", 5);

    if (variantsError) throw variantsError;

    // Count unique products with low stock
    const lowStockProductIds = new Set(variantsData?.map((v) => v.product_id) || []);
    const lowStock = lowStockProductIds.size;

    return {
      totalRevenue,
      todayOrders,
      monthlyOrders,
      totalProducts,
      lowStock,
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

// Recent orders for dashboard
export async function getRecentOrders(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Order[];
}

// Sales data for chart (last 7 days)
export async function getSalesData() {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("orders")
    .select("created_at, total_amount")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group by date
  const salesByDate = new Map<string, number>();

  data?.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split("T")[0];
    const currentSales = salesByDate.get(date) || 0;
    salesByDate.set(date, currentSales + order.total_amount);
  });

  // Create array for last 7 days
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    result.push({
      date: dateStr,
      sales: salesByDate.get(dateStr) || 0,
    });
  }

  return result;
}

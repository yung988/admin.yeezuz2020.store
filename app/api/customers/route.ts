import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          total_amount,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      )
    }

    // Transformuj data pro frontend
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postal_code: customer.postal_code,
      country: customer.country,
      created_at: customer.created_at,
      totalOrders: customer.orders?.length || 0,
      totalSpent: customer.orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
    }))

    return NextResponse.json(transformedCustomers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

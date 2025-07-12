import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validace možných stavů
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Aktualizace stavu objednávky
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        customer:customers(name, email, phone),
        shipping_address:shipping_addresses(street, city, postal_code, country),
        order_items(
          quantity,
          price,
          product:products(name)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Transformace dat pro frontend
    const transformedOrder = {
      id: data.id,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone
      },
      items: data.order_items.map((item: any) => ({
        product: item.product.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: data.total,
      status: data.status,
      date: data.created_at,
      shippingAddress: {
        street: data.shipping_address.street,
        city: data.shipping_address.city,
        postalCode: data.shipping_address.postal_code,
        country: data.shipping_address.country
      }
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

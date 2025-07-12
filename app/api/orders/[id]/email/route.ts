import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
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

    const supabase = createClient()

    // Získání detailů objednávky
    const { data: order, error } = await supabase
      .from('orders')
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
      .eq('id', id)
      .single()

    if (error || !order) {
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Vytvoření emailové zprávy podle stavu
    const emailContent = generateEmailContent(order, status)
    
    // Simulace odeslání emailu (v produkci by zde byl skutečný email provider)
    console.log('Sending email to:', order.customer.email)
    console.log('Email content:', emailContent)

    // Zde by byla integrace s email službo jako SendGrid, Resend, nebo podobné
    // Pro demo účely pouze logujeme
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email notification sent successfully',
      recipient: order.customer.email,
      subject: emailContent.subject
    })

  } catch (error) {
    console.error('Error in POST /api/orders/[id]/email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateEmailContent(order: any, status: string) {
  const statusMessages = {
    pending: {
      subject: `Objednávka #${order.id} - Čeká na zpracování`,
      body: `Vaše objednávka #${order.id} je přijata a čeká na zpracování. Brzy Vás budeme kontaktovat s dalšími informacemi.`
    },
    paid: {
      subject: `Objednávka #${order.id} - Platba přijata`,
      body: `Vaše platba za objednávku #${order.id} byla úspěšně přijata. Objednávka bude nyní zpracována.`
    },
    shipped: {
      subject: `Objednávka #${order.id} - Odesláno`,
      body: `Vaše objednávka #${order.id} byla odeslána na adresu: ${order.shipping_address.street}, ${order.shipping_address.city}, ${order.shipping_address.postal_code}.`
    },
    delivered: {
      subject: `Objednávka #${order.id} - Doručeno`,
      body: `Vaše objednávka #${order.id} byla úspěšně doručena. Děkujeme za Vaši důvěru!`
    }
  }

  const content = statusMessages[status as keyof typeof statusMessages] || {
    subject: `Objednávka #${order.id} - Změna stavu`,
    body: `Stav Vaší objednávky #${order.id} byl změněn na: ${status}`
  }

  return {
    subject: content.subject,
    body: `Dobrý den ${order.customer.name},\n\n${content.body}\n\nS pozdravem,\nVáš tým Yeezuz`
  }
}

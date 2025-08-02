import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    console.log('Received order data:', JSON.stringify(body, null, 2));
    
    const { 
      amount, 
      currency = 'czk', 
      orderData, 
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      packetaPickupPointId,
      packetaPickupPointName,
      packetaPickupPointAddress,
      idempotencyKey // Add idempotency key to prevent duplicate orders
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' }, 
        { status: 400 }
      );
    }

    // Note: packetaPickupPointId is optional for now
    // if (!packetaPickupPointId) {
    //   return NextResponse.json(
    //     { error: 'Packeta pickup point is required' }, 
    //     { status: 400 }
    //   );
    // }

    // Create Supabase client
    const supabase = await createClient();

    // Check if payment intent with this idempotency key already exists
    if (idempotencyKey) {
      const { data: existingOrder, error: existingOrderError } = await supabase
        .from('orders')
        .select('*, stripe_payment_id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

      if (existingOrder && existingOrder.stripe_payment_id) {
        console.log('Found existing order with idempotency key:', idempotencyKey);
        try {
          // Order already exists, return existing payment intent
          const existingPaymentIntent = await stripe.paymentIntents.retrieve(existingOrder.stripe_payment_id);
          
          const response = NextResponse.json({
            clientSecret: existingPaymentIntent.client_secret,
            paymentIntentId: existingPaymentIntent.id,
            orderId: existingOrder.id,
            orderNumber: existingOrder.order_number,
          });

          // Add CORS headers
          response.headers.set('Access-Control-Allow-Origin', origin || '*');
          response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          response.headers.set('Access-Control-Allow-Credentials', 'true');

          return response;
        } catch (stripeError) {
          console.error('Error retrieving existing payment intent:', stripeError);
          // If payment intent doesn't exist in Stripe, we'll create a new one below
        }
      }
    }

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || `${customerEmail}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create Payment Intent with temporary metadata (no order yet)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customer_email: customerEmail || '',
        customer_name: customerName || '',
        idempotency_key: finalIdempotencyKey,
        // We'll create the order after successful payment
      },
      description: `Objednávka eshop Yeezuz2020`,
      receipt_email: customerEmail || undefined,
    });

    const response = NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;

  } catch (error: any) {
    console.error('Stripe Payment Intent creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Payment initialization failed', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' }, 
    { status: 405 }
  );
}

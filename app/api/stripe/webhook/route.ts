import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createPacketaShipment } from '@/lib/packeta';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase with service role key for webhook
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side operations
);

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    const body = await request.text(); // Stripe requires raw body
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.processing':
        await handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Create order after successful payment
  const idempotencyKey = paymentIntent.metadata.idempotency_key;
  
  if (!idempotencyKey) {
    console.error('No idempotency_key in payment intent metadata');
    return;
  }

  // TODO: In a real implementation, you would need to store order data somewhere
  // (e.g., in a temporary table or Redis cache) and retrieve it here to create the order.
  // For now, we'll create a minimal order record.
  
  // Create minimal order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_email: paymentIntent.metadata.customer_email || '',
      customer_name: paymentIntent.metadata.customer_name || '',
      total_amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      status: 'confirmed',
      payment_status: 'paid',
      stripe_payment_id: paymentIntent.id,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Failed to create order:', orderError);
    return;
  }

  console.log(`Order ${order.id} created and marked as paid and confirmed`);
  
  // TODO: Add additional fulfillment logic:
  // - Send confirmation email
  // - Update inventory
  // - Notify customer
  // - Create Packeta shipment if needed
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  const idempotencyKey = paymentIntent.metadata.idempotency_key;
  
  if (!idempotencyKey) {
    console.error('No idempotency_key in payment intent metadata');
    return;
  }

  // Find order by idempotency key
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (fetchError || !order) {
    console.error('Failed to find order by idempotency key:', idempotencyKey);
    return;
  }

  // Update order status
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (error) {
    console.error('Failed to update order:', error);
    return;
  }

  console.log(`Order ${order.id} marked as failed`);
  
  // TODO: Add failure handling logic:
  // - Send failure notification email
  // - Release inventory holds
  // - Log failure reason
}

// Handle payment processing
async function handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment processing:', paymentIntent.id);
  
  const idempotencyKey = paymentIntent.metadata.idempotency_key;
  
  if (!idempotencyKey) {
    console.error('No idempotency_key in payment intent metadata');
    return;
  }

  // Find order by idempotency key
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (fetchError || !order) {
    console.error('Failed to find order by idempotency key:', idempotencyKey);
    return;
  }

  // Update order status
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'processing',
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (error) {
    console.error('Failed to update order:', error);
  }
}

// Handle payment requiring action
async function handlePaymentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment requires action:', paymentIntent.id);
  
  const idempotencyKey = paymentIntent.metadata.idempotency_key;
  
  if (!idempotencyKey) {
    console.error('No idempotency_key in payment intent metadata');
    return;
  }

  // Find order by idempotency key
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (fetchError || !order) {
    console.error('Failed to find order by idempotency key:', idempotencyKey);
    return;
  }

  // Update order status
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'requires_action',
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  if (error) {
    console.error('Failed to update order:', error);
  }
}

// Helper function to create Packeta shipment for order
async function createPacketaShipmentForOrder(orderId: string, order: any) {
  try {
    // Parse customer name - assume format "Name Surname" or just "Name"
    const nameParts = (order.customer_name || '').split(' ');
    const customerName = nameParts[0] || 'Unknown';
    const customerSurname = nameParts.slice(1).join(' ') || 'Customer';

    const orderData = {
      orderNumber: order.order_number || order.id,
      customerName,
      customerSurname,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || '',
      pickupPointId: order.packeta_pickup_point_id,
      orderValue: order.total_amount,
      weight: 1.0, // Default weight in kg - you might want to calculate this from order items
      cashOnDelivery: 0, // Set to 0 for prepaid orders
    };

    console.log('Creating Packeta shipment with data:', orderData);
    
    const result = await createPacketaShipment(orderData);
    
    // Update order with Packeta data
    if (result && result.id) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          packeta_label_id: result.id,
          packeta_tracking_number: result.barcode || result.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order with Packeta data:', updateError);
      } else {
        console.log(`Order ${orderId} updated with Packeta label ID: ${result.id}`);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Failed to create Packeta shipment:', error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

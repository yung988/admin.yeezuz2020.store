import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createPacketaShipment } from '@/lib/packeta';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '@/lib/email/sendEmail';

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
      customer_phone: paymentIntent.metadata.customer_phone || '',
      total_amount: paymentIntent.amount, // Store in cents as per database schema
      currency: paymentIntent.currency.toUpperCase(),
      status: 'paid',
      payment_status: 'paid',
      shipping_method: paymentIntent.metadata.packeta_pickup_point_id ? 'packeta' : 'standard',
      shipping_cost: paymentIntent.metadata.packeta_pickup_point_id ? 7900 : 0, // 79 Kč in cents
      packeta_pickup_point_id: paymentIntent.metadata.packeta_pickup_point_id || null,
      packeta_pickup_point_name: paymentIntent.metadata.packeta_pickup_point_name || null,
      packeta_pickup_point_address: paymentIntent.metadata.packeta_pickup_point_address || null,
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
  
  // Send confirmation email
  try {
    await sendOrderConfirmationEmail({
      to: order.customer_email,
      orderNumber: order.id.toString(),
      customerName: order.customer_name,
      orderDate: new Date(order.created_at).toLocaleDateString('cs-CZ'),
      items: [
        {
          name: 'Objednávka', // In real implementation, get from order_items
          quantity: 1,
          price: order.total_amount,
        }
      ],
      subtotal: order.total_amount,
      shipping: 0, // Add shipping cost if available
      total: order.total_amount,
      isPacketa: !!paymentIntent.metadata.packeta_pickup_point_id,
      packetaPickupPoint: paymentIntent.metadata.packeta_pickup_point_name,
    });
    console.log('Confirmation email sent successfully');
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }
  
  // Create Packeta shipment if pickup point is specified
  if (paymentIntent.metadata.packeta_pickup_point_id) {
    try {
      const updatedOrder = {
        ...order,
        customer_phone: paymentIntent.metadata.customer_phone || '',
        packeta_pickup_point_id: paymentIntent.metadata.packeta_pickup_point_id,
      };
      
      await createPacketaShipmentForOrder(order.id, updatedOrder);
      console.log('Packeta shipment created successfully');
      
      // Send shipping notification
      await sendOrderStatusUpdateEmail({
        to: order.customer_email,
        orderNumber: order.id.toString(),
        customerName: order.customer_name,
        newStatus: 'processing',
        message: 'Vaše objednávka je připravována k odeslání.',
      });
      console.log('Shipping notification sent successfully');
    } catch (packetaError) {
      console.error('Failed to create Packeta shipment:', packetaError);
    }
  }
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
      orderValue: order.total_amount / 100, // Convert cents to koruny for Packeta
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

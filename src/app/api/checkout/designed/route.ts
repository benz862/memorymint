import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/db';

// POST /api/checkout/designed  — initiates Stripe checkout for a DesignedCardOrder
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const order = await prisma.designedCardOrder.findUnique({
      where: { id: orderId },
      include: { designed_card: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Strip ALL control/non-printable chars that cause ERR_INVALID_CHAR in HTTP headers
    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '')
      .split('')
      .filter(c => c.charCodeAt(0) >= 33 && c.charCodeAt(0) < 127)
      .join('');
    const isMock = !stripeKey || stripeKey.includes('dummy') || stripeKey.includes('test_dummy');

    if (isMock) {
      await prisma.designedCardOrder.update({
        where: { id: order.id },
        data: { payment_status: 'completed' },
      });
      return NextResponse.json({ url: `${baseUrl}/success/designed/${order.id}` });
    }

    console.log('Stripe key length after sanitise:', stripeKey.length);
    console.log('Stripe key prefix:', stripeKey.substring(0, 7));

    // Use createFetchHttpClient to avoid Node.js HTTPS ERR_INVALID_CHAR issues
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-03-25.dahlia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Pricing — use inline price_data so no pre-created Price IDs are required
    const isLargeCard = order.selected_size === '5x7';
    const unitAmount = isLargeCard ? 599 : 399; // cents
    const sizeLabel = isLargeCard ? '5×7"' : '4×6"';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: `MemoryMint Greeting Card — ${sizeLabel}`,
              description: `High-resolution, print-ready greeting card PDF · ${order.designed_card.name || 'Pre-designed card'}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success/designed/${order.id}`,
      cancel_url: `${baseUrl}/catalogue/${order.designed_card.slug}`,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        designed_card_id: order.designed_card_id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('API /checkout/designed Error:', error?.message ?? error);
    console.error('Stripe error type:', error?.type ?? '');
    console.error('Stripe error code:', error?.code ?? '');
    return NextResponse.json({ error: error.message || 'Checkout error' }, { status: 500 });
  }
}

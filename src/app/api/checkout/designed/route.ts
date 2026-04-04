import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/db';
import { PRICING } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia',
});


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
    const isMockStripe =
      !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy');

    if (isMockStripe) {
      // Auto-complete in dev
      await prisma.designedCardOrder.update({
        where: { id: order.id },
        data: { payment_status: 'completed' },
      });
      return NextResponse.json({ url: `${baseUrl}/success/designed/${order.id}` });
    }

    const priceInfo = PRICING[order.selected_size];
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceInfo?.stripePriceId ?? (order.selected_size === '5x7'
            ? 'price_1TIUMkE6oTidvpnUl5bLIvTF'
            : 'price_1TIUMjE6oTidvpnU0BDTIukc'),
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success/designed/${order.id}`,
      cancel_url: `${baseUrl}/catalogue/${order.designed_card.slug}`,
      client_reference_id: order.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('API /checkout/designed Error:', error);
    return NextResponse.json({ error: error.message || 'Checkout error' }, { status: 500 });
  }
}

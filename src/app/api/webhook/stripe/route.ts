import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  // Initialise inside handler so Vercel always resolves the env var at runtime
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;

    if (orderId) {
      try {
        // Try standard CardProject order first
        const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });

        if (existingOrder) {
          const order = await prisma.order.update({
            where: { id: orderId },
            data: {
              payment_status: 'completed',
              purchaser_email: session.customer_details?.email || 'unknown@example.com',
              provider_payment_id: session.payment_intent as string,
            },
          });
          const downloadUrl = `/api/pdf/${order.card_project_id}?orderId=${order.id}`;
          await prisma.download.create({
            data: { order_id: order.id, card_project_id: order.card_project_id, download_url: downloadUrl },
          });
          await prisma.cardProject.update({
            where: { id: order.card_project_id },
            data: { status: 'purchased' },
          });
          console.log(`Standard order ${order.id} marked as completed.`);
        } else {
          // Try DesignedCardOrder
          const designedOrder = await prisma.designedCardOrder.findUnique({ where: { id: orderId } });
          if (designedOrder) {
            await prisma.designedCardOrder.update({
              where: { id: orderId },
              data: {
                payment_status: 'completed',
                purchaser_email: session.customer_details?.email || 'unknown@example.com',
              },
            });
            console.log(`Designed card order ${orderId} marked as completed.`);
          } else {
            console.warn(`Webhook: no order found for client_reference_id ${orderId}`);
          }
        }
      } catch (dbError: any) {
        console.error('DB webhook error:', dbError.message);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}


import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/db';
import { PRICING } from '@/lib/constants';

// We initialize Stripe with a dummy key for development MVP, 
// normally this would be process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia',
});


export async function POST(req: Request) {
  try {
    const { projectId, size } = await req.json();

    if (!projectId || !size) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const project = await prisma.cardProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const priceInfo = PRICING[size];
    if (!priceInfo) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    // Save order record initially as pending
    const orderNumber = `MM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const order = await prisma.order.create({
      data: {
        card_project_id: projectId,
        order_number: orderNumber,
        selected_size: size,
        amount: Math.round(priceInfo.price * 100), // in cents
        purchaser_email: "guest@example.com", // Will be updated conditionally later
        payment_status: "pending",
      }
    });

    // Create Checkout Session
    // For local MVP without a real Stripe key, we can simulate success mode
    // Normally we'd call stripe.checkout.sessions.create
    
    // Simulating for MVP
    const isMockStripe = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('dummy');
    
    if (isMockStripe) {
      // Auto-succeed the local test
      await prisma.order.update({
        where: { id: order.id },
        data: { payment_status: 'completed' }
      });
      // Redirect straight to success
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success/${order.id}`;
      return NextResponse.json({ url: successUrl });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceInfo.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success/${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${projectId}`,
      client_reference_id: order.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('API /checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Error processing checkout' }, { status: 500 });
  }
}

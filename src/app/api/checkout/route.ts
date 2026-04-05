import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/db';
import { PRICING } from '@/lib/constants';

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

    // Create order record as pending
    const orderNumber = `MM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const order = await prisma.order.create({
      data: {
        card_project_id: projectId,
        order_number: orderNumber,
        selected_size: size,
        amount: Math.round(priceInfo.price * 100),
        purchaser_email: 'guest@example.com',
        payment_status: 'pending',
      },
    });

    // Strip ALL control/non-ASCII chars that cause ERR_INVALID_CHAR in HTTP headers
    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '')
      .split('')
      .filter(c => c.charCodeAt(0) >= 33 && c.charCodeAt(0) < 127)
      .join('');

    const isMock = !stripeKey || stripeKey.includes('dummy') || stripeKey.includes('test_dummy');

    if (isMock) {
      await prisma.order.update({
        where: { id: order.id },
        data: { payment_status: 'completed' },
      });
      const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success/${order.id}`;
      return NextResponse.json({ url: successUrl });
    }

    console.log('Stripe key length after sanitise:', stripeKey.length);
    console.log('Stripe key prefix:', stripeKey.substring(0, 7));

    // Use createFetchHttpClient to avoid Node.js HTTPS ERR_INVALID_CHAR issues
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-03-25.dahlia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://memorymint.app').replace(/\/$/, '');

    const successUrl = `${appUrl}/success/${order.id}`;
    const cancelUrl = `${appUrl}/preview/${projectId}`;

    console.log('Stripe success_url:', successUrl);
    console.log('Stripe cancel_url:', cancelUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(priceInfo.price * 100),
            product_data: {
              name: `MemoryMint ${priceInfo.label}`,
              description: `Print-ready greeting card PDF (${priceInfo.dimensions})`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/success/${order.id}`,
      cancel_url: `${appUrl}/preview/${projectId}`,
      client_reference_id: order.id,
      metadata: { order_id: order.id, project_id: projectId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('API /checkout Error:', error?.message ?? error);
    console.error('Stripe error type:', error?.type ?? '');
    console.error('Stripe error code:', error?.code ?? '');
    return NextResponse.json(
      { error: error.message || 'Error processing checkout' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/designed-card/order  — creates a pending DesignedCardOrder
export async function POST(req: Request) {
  try {
    const { designedCardId, insidePhotoUrl, insidePhotoCaption, insideMessage, selectedSize } =
      await req.json();

    if (!designedCardId || insideMessage === undefined || insideMessage === null || !selectedSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const designedCard = await prisma.designedCard.findUnique({
      where: { id: designedCardId },
    });

    if (!designedCard || !designedCard.is_active) {
      return NextResponse.json({ error: 'Card design not found' }, { status: 404 });
    }

    const orderNumber = `MM-DC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Pricing: same as standard cards
    const priceMap: Record<string, number> = { '4x6': 399, '5x7': 599 }; // cents
    const amount = priceMap[selectedSize];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    const order = await prisma.designedCardOrder.create({
      data: {
        designed_card_id: designedCardId,
        inside_photo_url: insidePhotoUrl || null,
        inside_photo_caption: insidePhotoCaption || null,
        inside_message: insideMessage,
        selected_size: selectedSize,
        order_number: orderNumber,
        amount,
        payment_status: 'pending',
      },
    });

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
  } catch (error: any) {
    console.error('API /designed-card/order Error:', error);
    return NextResponse.json({ error: error.message || 'Error creating order' }, { status: 500 });
  }
}

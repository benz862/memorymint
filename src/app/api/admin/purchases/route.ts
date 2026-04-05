import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [orders, designedOrders] = await Promise.all([
      prisma.order.findMany({
        where: { payment_status: 'completed' },
        orderBy: { created_at: 'desc' },
      }),
      prisma.designedCardOrder.findMany({
        where: { payment_status: 'completed' },
        include: { designed_card: { select: { name: true, category: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const combined = [
      ...orders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        email: o.purchaser_email,
        product: `Custom Card (${o.selected_size})`,
        card_type: 'custom_card' as const,
        card_name: null,
        size: o.selected_size,
        amount_usd: (o.amount / 100).toFixed(2),
        purchased_at: o.created_at,
        stripe_payment_id: o.provider_payment_id,
      })),
      ...designedOrders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        email: o.purchaser_email,
        product: `${o.designed_card.name} (${o.selected_size})`,
        card_type: 'designed_card' as const,
        card_name: o.designed_card.name,
        size: o.selected_size,
        amount_usd: (o.amount / 100).toFixed(2),
        purchased_at: o.created_at,
        stripe_payment_id: o.provider_payment_id,
      })),
    ].sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());

    const totalRevenue = combined.reduce((sum, o) => sum + parseFloat(o.amount_usd), 0);

    return NextResponse.json({ purchases: combined, totalRevenue: totalRevenue.toFixed(2), count: combined.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

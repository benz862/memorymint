import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { DesignedCardDocument } from '@/components/DesignedCardDocument';
import React from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Fetches an image by URL and returns a base64 data URI for @react-pdf/renderer.
// Works for both absolute URLs (Supabase, etc.) and local public/ paths.
async function imageToBase64(urlOrPath: string): Promise<string> {
  const url = urlOrPath.startsWith('http') ? urlOrPath : `${BASE_URL}${urlOrPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  const buffer = await res.arrayBuffer();
  const mime = res.headers.get('content-type') || 'image/png';
  return `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.designedCardOrder.findUnique({
      where: { id: orderId },
      include: { designed_card: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Determine watermark: remove it only on completed paid orders
    // The query param ?paid=1 is checked alongside payment_status
    const url = new URL(req.url);
    const paidParam = url.searchParams.get('paid');
    const isWatermarked = !(paidParam === '1' && order.payment_status === 'completed');

    // Convert images to base64 data URIs
    const [frontBase64, backBase64] = await Promise.all([
      imageToBase64(order.designed_card.front_image_url),
      imageToBase64(order.designed_card.back_image_url),
    ]);

    let insidePhotoBase64: string | undefined;
    if (order.inside_photo_url) {
      try {
        insidePhotoBase64 = await imageToBase64(order.inside_photo_url);
      } catch {
        // If client photo can't be read, render without it
        insidePhotoBase64 = undefined;
      }
    }

    const size = (order.selected_size as '4x6' | '5x7') || '5x7';
    const messageFontSize = order.inside_message_font_size ?? 15;

    // Extract frame style from stored caption JSON (if any)
    let frameStyle: string = 'polaroid';
    if (order.inside_photo_caption) {
      try {
        const cs = JSON.parse(order.inside_photo_caption);
        if (cs.frameStyle) frameStyle = cs.frameStyle;
      } catch { /* ignore */ }
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(DesignedCardDocument, {
        frontImageBase64: frontBase64,
        backImageBase64: backBase64,
        insidePhotoBase64,
        insidePhotoCaption: order.inside_photo_caption ?? undefined,
        insideMessage: order.inside_message,
        size,
        isWatermarked,
        messageFontSize,
        frameStyle,
      }) as any
    );

    const filename = isWatermarked
      ? 'memorymint-card-preview.pdf'
      : `memorymint-card-${order.order_number}.pdf`;

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isWatermarked
          ? `inline; filename="${filename}"`
          : `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('PDF/designed generation error:', error);
    return NextResponse.json(
      { error: error.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}

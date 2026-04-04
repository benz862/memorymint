import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { DesignedCardDocument } from '@/components/DesignedCardDocument';
import React from 'react';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Reads an image from the filesystem (stored under /public) and returns
// a base64 data URI that @react-pdf/renderer can embed directly.
async function imageToBase64(publicRelativePath: string): Promise<string> {
  // publicRelativePath is like "/cards/birthday-001-front.png"
  const absPath = join(process.cwd(), 'public', decodeURIComponent(publicRelativePath.replace(/^\//, '')));
  const buffer = await readFile(absPath);

  // Determine MIME type from extension
  const ext = absPath.split('.').pop()?.toLowerCase() || 'png';
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  const mime = mimeMap[ext] || 'image/png';

  return `data:${mime};base64,${buffer.toString('base64')}`;
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

    const pdfBuffer = await renderToBuffer(
      React.createElement(DesignedCardDocument, {
        frontImageBase64: frontBase64,
        backImageBase64: backBase64,
        insidePhotoBase64,
        insidePhotoCaption: order.inside_photo_caption ?? undefined,
        insideMessage: order.inside_message,
        size,
        isWatermarked,
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

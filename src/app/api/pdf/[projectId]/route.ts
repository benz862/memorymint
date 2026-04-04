import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { CardDocument } from '@/components/CardDocument';
import { DesignedCardDocument } from '@/components/DesignedCardDocument';
import React from 'react';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await prisma.cardProject.findUnique({
      where: { id: projectId },
      include: { font: true },   // pull the selected Font record
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if this is a paid download request
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    let isWatermarked = true;

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId, payment_status: 'completed' },
      });
      if (order && order.card_project_id === projectId) {
        isWatermarked = false;
      }
    }

    const message = project.edited_text || project.generated_text || '';
    const size = (project.selected_size || '5x7') as '4x6' | '5x7';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Font family from the selected font record (fallback to Times-Roman for elegance)
    const messageFontFamily = (project as any).font?.font_family ?? 'Georgia';
    const senderName = project.sender_name ?? '';

    // Resolve inside photo URL
    const insidePhotoUrl = project.inside_photo_url
      ? (project.inside_photo_url.startsWith('http')
          ? project.inside_photo_url
          : `${baseUrl}${project.inside_photo_url}`)
      : undefined;

    // Caption JSON string (as saved from PhotoEditor)
    const insidePhotoCaption = project.inside_photo_caption ?? undefined;

    let pdfBuffer: Buffer;

    if (project.designed_card_id) {
      // ── Pre-designed card flow ─────────────────────────────────
      // Use DesignedCardDocument which has the SkillBinder back cover
      // and proper polaroid photo+caption rendering.
      const designedCard = await prisma.designedCard.findUnique({
        where: { id: project.designed_card_id },
      });

      if (!designedCard) {
        return NextResponse.json({ error: 'Designed card not found' }, { status: 404 });
      }

      const frontImageUrl = designedCard.front_image_url.startsWith('http')
        ? designedCard.front_image_url
        : `${baseUrl}${decodeURIComponent(designedCard.front_image_url)}`;

      // Back image not used — DesignedCardDocument renders the
      // SkillBinder logo programmatically on a white back cover.
      pdfBuffer = await renderToBuffer(
        React.createElement(DesignedCardDocument, {
          frontImageBase64: frontImageUrl,
          backImageBase64:  '',
          insidePhotoBase64: insidePhotoUrl,
          insidePhotoCaption,
          insideMessage: message,
          messageFontFamily,
          senderName,
          size,
          isWatermarked,
        }) as any
      );
    } else {
      // ── Custom card flow (user-uploaded front/back) ────────────
      pdfBuffer = await renderToBuffer(
        React.createElement(CardDocument, {
          message,
          messageFontFamily,
          senderName,
          size,
          isWatermarked,
          insidePhotoBase64: insidePhotoUrl,
          insidePhotoCaption,
        }) as any
      );
    }

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isWatermarked
          ? 'inline; filename="memorymint-preview.pdf"'
          : 'attachment; filename="memorymint-card.pdf"',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}

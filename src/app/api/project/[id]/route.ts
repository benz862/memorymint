import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Allowlist only the fields we expect to update from the client
    // (Prevents passing arbitrary/unknown fields to Prisma which causes runtime errors)
    const data: Record<string, any> = {};
    const allowed = [
      'selected_size',
      'selected_template_id',
      'selected_font_id',
      'designed_card_id',
      'inside_photo_url',
      'inside_photo_caption',
      'generated_text',
      'edited_text',
      'status',
      'preview_pdf_url',
      'final_pdf_url',
      'sender_name',
      'recipient_name',
    ];
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const project = await prisma.cardProject.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('API /project PUT Error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || 'Error updating project' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.cardProject.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('API /project GET Error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching project' },
      { status: 500 }
    );
  }
}

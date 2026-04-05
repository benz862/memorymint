import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// MUST be force-dynamic — Vercel's edge caches GET redirects, which prevents
// the DB update from running when a different card is selected.
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");

  if (!cardId) {
    return NextResponse.redirect(new URL(`/choose-card/${projectId}`, req.url));
  }

  try {
    // Verify the card actually exists before saving
    const card = await prisma.designedCard.findUnique({ where: { id: cardId } });
    if (!card) {
      console.error(`[select] Card not found: ${cardId}`);
      return NextResponse.redirect(new URL(`/choose-card/${projectId}`, req.url));
    }

    // Verify the project exists
    const project = await prisma.cardProject.findUnique({ where: { id: projectId } });
    if (!project) {
      console.error(`[select] Project not found: ${projectId}`);
      return NextResponse.redirect(new URL(`/create`, req.url));
    }

    // Save the selected card against the project
    await prisma.cardProject.update({
      where: { id: projectId },
      data: { designed_card_id: cardId },
    });

    // Redirect to customization step — no-store so Vercel never caches this
    return NextResponse.redirect(new URL(`/customize/${projectId}`, req.url), {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });

  } catch (err: any) {
    console.error("[select] 500 error:", err?.message ?? err);
    // Return a plain error response so we can see what's wrong in the browser
    return new NextResponse(
      `Error selecting card: ${err?.message ?? "Unknown error"}`,
      { status: 500, headers: { "content-type": "text/plain" } }
    );
  }
}

import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import prisma from '@/lib/db';
import { WORD_LIMITS } from '@/lib/constants';
import { DesiredLength } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      senderName,
      recipientName,
      occasionSubtype,
      tone,
      desiredLength,
      memories,
      qualities,
      desiredFeeling,
    } = body;

    if (!senderName || !recipientName || !occasionSubtype) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lengthLimits = WORD_LIMITS[desiredLength as DesiredLength] || WORD_LIMITS['medium'];

    // Construct the strict system prompt
    const systemPrompt = `You are an expert, emotionally intelligent greeting card writer. Your task is to write a highly personal message for a romantic greeting card.

    CRITICAL INSTRUCTIONS:
    1. NEVER invent or fabricate facts, dates, trips, or shared experiences not explicitly provided by the user.
    2. NEVER use generic, mass-market greeting card clichés.
    3. The message MUST be strictly between ${lengthLimits.min} and ${lengthLimits.max} words. Do not overflow or underflow.
    4. Prioritize sincerity, warmth, and intimacy over embellishment.
    5. Directly integrate the sender's memories and the qualities they love about the recipient without it sounding like a list.
    6. Sound like a real, genuine human being who deeply knows the recipient.
    
    DETAILS FOR THIS CARD:
    - SENDER: ${senderName}
    - RECIPIENT: ${recipientName}
    - OCCASION: ${occasionSubtype.replace('-', ' ')}
    - TONE: ${tone}
    - WHAT THEY WANT THE RECIPIENT TO FEEL: ${desiredFeeling || 'Loved and appreciated'}
    - QUALITIES THEY LOVE: ${qualities || 'None provided'}
    - SPECIAL MEMORIES: ${memories || 'None provided'}
    
    Format your response as just the heartfelt message itself. Do NOT include "Dear [Name]" or "Love, [Name]" inside your generated text unless it flows perfectly into the body, because the card template may already include name fields. Just write the core message.`;

    const result = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: "Write the message.",
      temperature: 0.7,
    });

    const generatedText = result.text.trim();

    // Find the occasion subtype (searches across all themes)
    const subtype = await prisma.occasionSubtype.findFirst({
      where: { slug: occasionSubtype },
      include: { theme: true },
    });
    if (!subtype) throw new Error(`Occasion subtype not found: ${occasionSubtype}`);

    const theme = subtype.theme;

    // Save draft to DB
    const project = await prisma.cardProject.create({
      data: {
        theme_id: theme.id,
        occasion_subtype_id: subtype.id,
        sender_name: senderName,
        recipient_name: recipientName,
        tone: tone,
        desired_length: desiredLength,
        memories_json: JSON.stringify(memories || ""),
        qualities_json: JSON.stringify(qualities || ""),
        places_json: "[]",
        desired_feeling: desiredFeeling,
        generated_text: generatedText,
        edited_text: generatedText,
        status: 'draft',
      }
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      text: generatedText,
    });

  } catch (error: any) {
    console.error('API /generate Error:', error);
    return NextResponse.json({ error: error.message || 'Error generating text' }, { status: 500 });
  }
}

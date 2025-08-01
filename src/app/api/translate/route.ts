// src/app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { smartTranslate } from '@/ai/flows/smart-translate';
import { z } from 'zod';

const TranslateRequestSchema = z.object({
  text: z.string().min(1, { message: "Text to translate cannot be empty." }),
  targetLanguage: z.string().min(2, { message: "Target language code must be provided." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = TranslateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { text, targetLanguage } = validation.data;

    const result = await smartTranslate({ text, targetLanguage });

    if (result.translation === 'Language detection confidence is too low to translate.') {
      return NextResponse.json({ error: result.translation, ...result }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('Translation API Error:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Failed to get translation: ${errorMessage}` }, { status: 500 });
  }
}

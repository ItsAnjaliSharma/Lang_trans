'use server';

import { smartTranslate } from '@/ai/flows/smart-translate';

interface TranslationResult {
  translation: string;
  detectedLanguage: string;
  confidence: number;
  error?: undefined;
}

interface ErrorResult {
  error: string;
  translation?: undefined;
  detectedLanguage?: undefined;
  confidence?: undefined;
}

export async function getTranslation(
  text: string,
  targetLanguage: string,
  sourceLanguage: string
): Promise<TranslationResult | ErrorResult> {
  try {
    // The smartTranslate flow doesn't use the source language, 
    // as it's designed to auto-detect. We pass the target language.
    const result = await smartTranslate({ text, targetLanguage });

    return {
      translation: result.translation,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to get translation: ${errorMessage}` };
  }
}

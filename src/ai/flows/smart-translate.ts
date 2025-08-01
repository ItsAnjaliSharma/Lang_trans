// A smart translation AI agent which translates text, but only if the automatic language detection has sufficient confidence.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTranslateInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language to translate the text to.'),
});
export type SmartTranslateInput = z.infer<typeof SmartTranslateInputSchema>;

const SmartTranslateOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
  detectedLanguage: z.string().describe('The detected language of the input text.'),
  confidence: z.number().describe('The confidence level of the language detection.'),
});
export type SmartTranslateOutput = z.infer<typeof SmartTranslateOutputSchema>;

export async function smartTranslate(input: SmartTranslateInput): Promise<SmartTranslateOutput> {
  return smartTranslateFlow(input);
}

const languageDetectionPrompt = ai.definePrompt({
  name: 'languageDetectionPrompt',
  input: {schema: z.object({text: z.string()})},
  output: {schema: z.object({language: z.string(), confidence: z.number()})},
  prompt: `Detect the language of the following text and its confidence level. Return the language and confidence as a JSON object.\n\nText: {{{text}}}`,
});

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {schema: z.object({text: z.string(), targetLanguage: z.string()})},
  output: {schema: z.object({translation: z.string()})},
  prompt: `You are an expert translator. Translate the text content within the following HTML to {{targetLanguage}}. It is crucial that you preserve all HTML tags, attributes, and the overall structure of the document. Only translate the human-readable text content found between the tags.\n\nHTML: {{{text}}}`,
});

const smartTranslateFlow = ai.defineFlow(
  {
    name: 'smartTranslateFlow',
    inputSchema: SmartTranslateInputSchema,
    outputSchema: SmartTranslateOutputSchema,
  },
  async input => {
    const languageDetectionResult = await languageDetectionPrompt({text: input.text});

    const detectedLanguage = languageDetectionResult.output?.language;
    const confidence = languageDetectionResult.output?.confidence;

    if (!detectedLanguage || !confidence) {
      throw new Error('Could not detect language.');
    }

    if (confidence < 0.7) {
      return {
        translation: 'Language detection confidence is too low to translate.',
        detectedLanguage: detectedLanguage,
        confidence: confidence,
      };
    }

    const translationResult = await translationPrompt({text: input.text, targetLanguage: input.targetLanguage});

    return {
      translation: translationResult.output!.translation,
      detectedLanguage: detectedLanguage,
      confidence: confidence,
    };
  }
);

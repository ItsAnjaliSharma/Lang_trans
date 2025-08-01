'use server';

/**
 * @fileOverview A flow for automatically detecting the language of input text.
 *
 * - autoDetectLanguage - A function that handles the language detection process.
 * - AutoDetectLanguageInput - The input type for the autoDetectLanguage function.
 * - AutoDetectLanguageOutput - The return type for the autoDetectLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoDetectLanguageInputSchema = z.object({
  text: z.string().describe('The text to detect the language of.'),
});
export type AutoDetectLanguageInput = z.infer<typeof AutoDetectLanguageInputSchema>;

const AutoDetectLanguageOutputSchema = z.object({
  language: z.string().describe('The detected language of the text.'),
  confidence: z.number().describe('The confidence level of the language detection (0-1).'),
});
export type AutoDetectLanguageOutput = z.infer<typeof AutoDetectLanguageOutputSchema>;

export async function autoDetectLanguage(input: AutoDetectLanguageInput): Promise<AutoDetectLanguageOutput> {
  return autoDetectLanguageFlow(input);
}

const autoDetectLanguagePrompt = ai.definePrompt({
  name: 'autoDetectLanguagePrompt',
  input: {schema: AutoDetectLanguageInputSchema},
  output: {schema: AutoDetectLanguageOutputSchema},
  prompt: `You are an expert in language detection. Analyze the following text and determine its language and your confidence level.

Text: {{{text}}}

Respond with a JSON object that includes the detected language and a confidence score between 0 and 1.
`,
});

const autoDetectLanguageFlow = ai.defineFlow(
  {
    name: 'autoDetectLanguageFlow',
    inputSchema: AutoDetectLanguageInputSchema,
    outputSchema: AutoDetectLanguageOutputSchema,
  },
  async input => {
    const {output} = await autoDetectLanguagePrompt(input);
    return output!;
  }
);

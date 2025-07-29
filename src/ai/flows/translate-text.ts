'use server';

/**
 * @fileOverview A simple text translation flow using the Lelapa API.
 *
 * - translateText - A function that translates text to a target language.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text content to be translated.'),
  targetLanguage: z.string().describe('The target language for the translation (e.g., "zul_Latn").'),
  sourceLanguage: z.string().optional().describe('The source language of the text (e.g., "eng_Latn"). Defaults to English.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The resulting translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  const { text, targetLanguage, sourceLanguage } = input;
  
  console.log('LELAPA_API env var:', process.env.LELAPA_API ? 'loaded' : 'not found');
  if (!process.env.LELAPA_API) {
    throw new Error('LELAPA_API environment variable is not set.');
  }

  // Do not call the API for empty strings
  if (!text || text.trim() === '') {
    return { translatedText: '' };
  }

  try {
    const response = await fetch('https://vulavula-services.lelapa.ai/api/v1/translate/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-TOKEN': process.env.LELAPA_API,
      },
      body: JSON.stringify({
        input_text: text,
        source_lang: sourceLanguage || 'eng_Latn',
        target_lang: targetLanguage,
      }),
    });

    const result = await response.json();
    console.log('Lelapa API Response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
        console.error("Lelapa API Error:", result);
        throw new Error(`Lelapa API request failed with status ${response.status}: ${result.detail || 'Unknown error'}`);
    }
    
    // The API returns the translated text in an array, inside the `output_text` field.
    const translatedText = result?.output_text?.[0] || '';

    return { translatedText };
  } catch (error) {
    console.error('Error translating text with Lelapa API:', error);
    // Return original text if translation fails to not break the UI
    return { translatedText: text };
  }
}

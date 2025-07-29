'use server';

/**
 * @fileOverview Transcribes audio to text using AI.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {readFileSync, unlinkSync, writeFileSync} from 'fs';
import * as os from 'os';
import * as path from 'path';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.warn('ffmpeg-static not found, audio conversion may not work');
}


const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

async function convertToMp3(
  inputBuffer: Buffer,
  inputMimeType: string
): Promise<Buffer> {
  const tempInputPath = path.join(
    os.tmpdir(),
    `careiq-audio-in-${Date.now()}`
  );
  const tempOutputPath = path.join(
    os.tmpdir(),
    `careiq-audio-out-${Date.now()}.mp3`
  );
  writeFileSync(tempInputPath, inputBuffer);

  return new Promise((resolve, reject) => {
    ffmpeg(tempInputPath)
      .format('mp3')
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        unlinkSync(tempInputPath);
        reject(err);
      })
      .on('end', () => {
        const outputBuffer = readFileSync(tempOutputPath);
        unlinkSync(tempInputPath);
        unlinkSync(tempOutputPath);
        resolve(outputBuffer);
      })
      .save(tempOutputPath);
  });
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async ({ audioDataUri }) => {
    const dataUriRegex = /^data:(audio\/.+);base64,(.+)$/;
    const matches = audioDataUri.match(dataUriRegex);

    if (!matches) {
      throw new Error('Invalid audio data URI format.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    let audioBuffer = Buffer.from(base64Data, 'base64');
    let targetMimeType = mimeType;
    
    // Gemini 1.5 Flash requires MP3, MP4, or other common audio formats.
    // WebM or Opus from browser recorder might not be supported directly.
    // Let's convert to MP3 to be safe.
    if (!['audio/mpeg', 'audio/mp3'].includes(mimeType)) {
        console.log(`Converting audio from ${mimeType} to mp3...`);
        audioBuffer = await convertToMp3(audioBuffer, mimeType);
        targetMimeType = 'audio/mp3';
        console.log('Conversion complete.');
    }

    const { text } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: [{
            media: {
                url: `data:${targetMimeType};base64,${audioBuffer.toString('base64')}`,
            }
        }, {
            text: 'You are a highly accurate audio transcription service. Transcribe the following audio recording of a person describing their medical symptoms.'
        }],
        config: {
          temperature: 0.1,
        }
    });

    return { transcription: text };
  }
);


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export type TicketCategory = 'billing' | 'technical' | 'general';

export interface ClassificationResult {
  category: TicketCategory;
  suggestedReply: string;
}

const VALID_CATEGORIES: TicketCategory[] = [
  'billing',
  'technical',
  'general',
];

const SYSTEM_PROMPT = `Kamu adalah asisten yang membantu tim customer support GoodevaDesk.
Tugasmu untuk setiap tiket:
1. Klasifikasikan kategori tiket ke SALAH SATU dari: "billing", "technical", "general".
2. Tulis draft balasan singkat (2-3 kalimat) yang sopan, empatik, dan membantu, seolah kamu agent support.

Jawab HANYA dengan JSON valid, tanpa teks lain, dengan bentuk persis:
{"category": "billing" | "technical" | "general", "suggested_reply": "..."}`;

function buildUserPrompt(subject: string, message: string): string {
  return `Subject: ${subject}
Message: ${message}`;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('LLM_API_KEY');

    if (!apiKey) {
      throw new Error('LLM_API_KEY is not configured');
    }

    this.client = new GoogleGenAI({
      apiKey,
    });

    this.model =
      this.config.get<string>('LLM_MODEL') ?? 'gemini-2.5-flash';

    this.timeoutMs = Number(
      this.config.get<string>('LLM_TIMEOUT_MS') ?? 8000,
    );
  }

  async classify(
    subject: string,
    message: string,
  ): Promise<ClassificationResult | null> {
    try {
      const result = await Promise.race([
        this.client.models.generateContent({
          model: this.model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${SYSTEM_PROMPT}

${buildUserPrompt(subject, message)}`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),

        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('LLM_TIMEOUT'));
          }, this.timeoutMs);
        }),
      ]);

      const raw = result.text;

      if (!raw) {
        this.logger.warn('Gemini returned empty content');
        return null;
      }

      return this.parseAndValidate(raw);
    } catch (err: any) {
      if (err?.message === 'LLM_TIMEOUT') {
        this.logger.warn(
          `Gemini call timed out after ${this.timeoutMs}ms`,
        );
      } else if (err?.status === 429) {
        this.logger.warn('Gemini rate limited (429)');
      } else {
        this.logger.error(
          `Gemini call failed: ${err?.message ?? err}`,
        );
      }

      return null;
    }
  }

  private parseAndValidate(
    raw: string,
  ): ClassificationResult | null {
    try {
      const parsed = JSON.parse(raw);

      const category = parsed?.category;
      const suggestedReply =
        parsed?.suggested_reply ?? parsed?.suggestedReply;

      const isValidCategory =
        VALID_CATEGORIES.includes(category);

      const isValidReply =
        typeof suggestedReply === 'string' &&
        suggestedReply.trim().length > 0;

      if (!isValidCategory || !isValidReply) {
        this.logger.warn(
          `Gemini response failed shape validation: ${raw}`,
        );
        return null;
      }

      return {
        category,
        suggestedReply: suggestedReply.trim(),
      };
    } catch {
      this.logger.warn(
        `Gemini response was not valid JSON: ${raw}`,
      );
      return null;
    }
  }
}
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const cases = [
  {
    subject: 'Tagihan saya double charge',
    message:
      'Halo, saya ditagih 2x bulan ini untuk paket yang sama, tolong dicek.',
  },
  {
    subject: 'Aplikasi force close terus',
    message:
      'Setiap saya buka menu laporan, aplikasi langsung close sendiri. Sudah update ke versi terbaru tapi masih sama.',
  },
  {
    subject: 'Tanya jam operasional',
    message:
      'Halo, kantor cabang Bandung buka jam berapa ya hari Sabtu?',
  },
];

async function main() {
  const client = new GoogleGenAI({
    apiKey: process.env.LLM_API_KEY,
  });

  const model = process.env.LLM_MODEL ?? 'gemini-2.5-flash';

  for (const c of cases) {
    console.log(`\n=== ${c.subject} ===`);

    try {
      const response = await client.models.generateContent({
        model,
        contents: `
Kamu adalah asisten customer support GoodevaDesk.

Klasifikasikan tiket ke salah satu:
- billing
- technical
- general

Buat juga draft balasan singkat 2-3 kalimat.

Jangan mengarang informasi yang tidak terdapat dalam tiket. 
Jika informasi yang dibutuhkan untuk menjawab tidak tersedia,
buat balasan yang meminta customer memberikan informasi lebih lanjut atau menyatakan bahwa informasi tersebut perlu dikonfirmasi.

Jawab HANYA dengan JSON:
{
  "category": "billing | technical | general",
  "suggested_reply": "..."
}

Subject: ${c.subject}
Message: ${c.message}
        `,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      console.log(response.text);
    } catch (err) {
      console.error('FAILED:', err);
    }
  }
}

main();
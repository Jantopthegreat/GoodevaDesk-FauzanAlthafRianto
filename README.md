# Goodeva Desk - Fauzan Althaf Rianto

## Tech Stack

    NestJS + TypeScript + Prisma + PostgreSQL
    Redis (cache)
    GoogleGeminiAI (LLM)

## Arsitektur Sistem

src/
organization/
organization.module.ts
organization.service.ts # validasi api_key

ticket/
ticket.module.ts
ticket.controller.ts # thin, cuma panggil service
ticket.service.ts # semua business logic di sini
dto/
create-ticket.dto.ts
list-ticket.query.dto.ts
update-status.dto.ts

llm/
llm.module.ts
llm.service.ts # panggil OpenAI/Anthropic + error handling

cache/
cache.module.ts
cache.service.ts # wrapper ioredis

common/
guards/api-key.guard.ts
decorators/current-org.decorator.ts

prisma/
schema.prisma

## Cara Menjalankan

1. Clone Repository yang sudah saya kirimkan
   git clone [ISI: Nama Repo]
   cd [ISI: nama folder]
   npm install

2. Isi env dengan format env example

        DATABASE_URL="postgresql://goodevadesk:goodevadesk@localhost:"PORT"/goodevadesk"
        REDIS_URL="redis://localhost:"PORT"

        LLM_API_KEY= "API KEY GEMINI"
        LLM_TIMEOUT_MS=8000
        LLM_MODEL="gemini-3.5-flash-lite"

3. Jalankan DB & Redis

        ` docker compose -d `

4. Jalankan Migrate + Seeding
   `npx prisma migrate dev`
   `npx prisma db seed`

# Note : Seeding ada di src/prisma/seed dengan format, Seed dibuat 2 Organization untuk test Tenant Isolation

`const orgs = [
 { name: 'PT Ojan Sejahtera', apiKey: '123' },
 { name: 'PT Althaf Sukses jaya xoxo', apiKey: '456' },
  ];`

5. Jalankan Aplikasi

   `npm run start:dev`

# LLM yang dipilih adalah gemini-2.5-flash (Bisa diganti oleh LLM Model Lain )

Alasan:

1. Gratis, lewat Google AI Studio, tanpa kartu kredit, kuota harian cukup buat kebutuhan development/testing take-home ini.
2. Structured output lebih ketat dari sekadar "JSON valid" Gemini support responseSchema, jadi field category dipaksa harus salah satu dari 3 enum yang ditentukan (billing/technical/general) langsung di level API, bukan cuma divalidasi manual setelah dapat response.

# Prompt yang dipakai

System instruction (dikirim terpisah dari user prompt, bukan digabung):
" SYSTEM_PROMPT = `Kamu adalah asisten yang membantu tim customer support GoodevaDesk.
Tugasmu untuk setiap tiket:

1. Klasifikasikan kategori tiket ke SALAH SATU dari: "billing", "technical", "general".
2. Tulis draft balasan singkat (2-3 kalimat) yang sopan, empatik, dan membantu, seolah kamu agent support.
3. Jangan mengarang informasi yang tidak terdapat dalam tiket. Jika informasi yang dibutuhkan untuk menjawab tidak tersedia, buat balasan yang meminta customer memberikan informasi lebih lanjut atau menyatakan bahwa informasi tersebut perlu dikonfirmasi.
   Jawab HANYA dengan JSON valid, tanpa teks lain, dengan bentuk persis:
   {"category": "billing" | "technical" | "general", "suggested_reply": "..."}`; "

User Prompt :
Subject: {subject}
Message: {message}

Plus responseSchema yang eksplisit define category sebagai enum dan suggested_reply sebagai string wajib ada. Hasilnya tetap divalidasi manual sekali lagi sebelum disimpan, tapi kemungkinan gagal validasi jauh lebih kecil dibanding kalau cuma mengandalkan instruksi di prompt doang.

# Skema Database

model Organization {
id String @id @default(uuid())
name String
apiKey String @unique @map("api_key")
tickets Ticket[]

@@map("organizations")
}

model Ticket {
id String @id @default(uuid())
organizationId String @map("organization_id")
organization Organization @relation(fields: [organizationId], references: [id])
customerEmail String @map("customer_email")
subject String
message String
category String?
suggestedReply String? @map("suggested_reply")
status TicketStatus @default(open)
createdAt DateTime @default(now()) @map("created_at")

@@index([organizationId, status])
@@index([organizationId, category])
@@map("tickets")
}

# Tenant isolation

Auth pakai header x-api-key, dicocokin ke tabel Organization. Semua query Ticket selalu ada where: { organizationId }, termasuk get by id dan update status. Kalau ticket-nya bukan punya org yang lagi login, balikin 404 , biar nggak bocorin data ticket-nya ada atau nggak.

# Redis Cache

Key-nya cache:{organizationId}:{hash(subject+message)}, hash pakai sha256 dari teks yang udah dinormalisasi (lowercase, trim, collapse spasi). TTL 24 jam.

# Error Handling LLM

LlmService.classify() didesain buat nggak pernah throw. Timeout 8 detik (pakai Promise.race manual, bukan andalin abort signal SDK), kalau gagal (timeout/rate limit/response tidak sesuai) langsung return null, terus ticket-nya tetap kesimpen dengan category & suggestedReply null. Mencegah jikalau LLM Down Ticket tetap masuk.

# Kalau ada waktu lebih

1. Buat Blocking pakai fuzzy matching sebelum LLM untuk menghemat token, jadi nanti alurnya Jika bisa di klasifikasi pakai fuzzy maka langsung masukkan kategori, jika ambigu hasilnya maka pakai bantuan LLM

2. Tiket yang kategorinya masih null (LLM gagal), dibuat bisa disimpan sementara dan nantinya akan di retry agar kategorinya tidak null.

3. Rate Limiting per Organization

4. Token & Prompt Optimization

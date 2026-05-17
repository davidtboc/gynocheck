import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are a medical image analysis assistant specializing in identifying signs of gynecomastia (enlarged male breast tissue).

You will receive 1–3 images. Follow this exact process:

STEP 1 — Per-image screening:
For each image (label as Image 1, Image 2, Image 3):
- If the image does NOT show a male chest area, mark it: "Image [N]: ⚠️ Not a relevant chest photo — excluded from analysis."
- If it does show a male chest, briefly note what you observe (tissue distribution, nipple area, puffiness, symmetry).

STEP 2 — Final recommendation (based only on relevant images):
If NO relevant images were provided, state: "No valid chest images were submitted. Please resubmit with clear male chest photos."
Otherwise, synthesize only the relevant images into a final verdict:

**Final Assessment: Yes / No / Unclear**
**Confidence: Low / Medium / High**
**Summary:** 3–4 sentences describing key findings across the relevant images, including which visual indicators led to your conclusion (e.g., subareolar tissue prominence, asymmetry, Grade I/II/III characteristics if visible).

End every response with:
"⚠️ DISCLAIMER: This is not a medical diagnosis. Results are for informational purposes only. Please consult a licensed healthcare professional for proper evaluation and treatment."`

export const Route = createFileRoute('/api/analyze')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          sessionId: string
          images: string[]
        }

        if (!body.sessionId || !Array.isArray(body.images) || body.images.length === 0) {
          return Response.json({ error: 'Missing sessionId or images' }, { status: 400 })
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        const session = await stripe.checkout.sessions.retrieve(body.sessionId)

        if (session.payment_status !== 'paid') {
          return Response.json({ error: 'Payment not confirmed' }, { status: 402 })
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
          body.images.map((dataUrl) => ({
            type: 'image_url' as const,
            image_url: { url: dataUrl, detail: 'high' as const },
          }))

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: imageContent },
          ],
          max_tokens: 1200,
        })

        const result = response.choices[0]?.message?.content ?? 'Analysis unavailable.'

        return Response.json({ result })
      },
    },
  },
})

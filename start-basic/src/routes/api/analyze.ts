import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are analyzing chest images to identify potential signs of gynecomastia (enlarged male breast tissue).

For each image provided:
1. Determine if it shows a male chest area
2. If yes, assess whether signs of gynecomastia are visible (enlarged glandular tissue, puffiness around nipple area, breast-like appearance)
3. If the image is not a clear, relevant chest photo, state that explicitly

Provide a structured response:
- Overall assessment: Yes / No / Unclear
- Confidence: Low / Medium / High
- Explanation: 2-3 sentences describing what you observe
- Per-image notes if multiple images were submitted

If any image is unrelated to a male chest, note: "Image [N]: Not a relevant chest photo."

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
            image_url: { url: dataUrl, detail: 'low' as const },
          }))

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: imageContent },
          ],
          max_tokens: 600,
        })

        const result = response.choices[0]?.message?.content ?? 'Analysis unavailable.'

        return Response.json({ result })
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'

export const Route = createFileRoute('/api/checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
        const origin = vercelUrl || process.env.PUBLIC_SITE_URL || 'http://localhost:3000'

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Gynecomastia AI Analysis',
                  description: 'AI-powered chest image analysis by a medical vision model',
                },
                unit_amount: 199,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/`,
        })

        return Response.json({ url: session.url })
      },
    },
  },
})

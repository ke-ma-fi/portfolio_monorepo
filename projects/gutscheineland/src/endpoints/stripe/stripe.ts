import Stripe from 'stripe'


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - Stripe types might not match exactly with this specific API version manually set
  apiVersion: '2025-06-30.basil',
})

export default stripe

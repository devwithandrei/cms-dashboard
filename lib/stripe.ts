import Stripe from "stripe";

if (!process.env.STRIPE_API_KEY) {
  throw new Error('STRIPE_API_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: "2022-11-15",
  typescript: true,
});

export const handleStripeError = (error: any) => {
  let message = 'An error occurred with the payment';
  
  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case 'StripeCardError':
        message = error.message || 'Your card was declined';
        break;
      case 'StripeRateLimitError':
        message = 'Too many requests, please try again later';
        break;
      case 'StripeInvalidRequestError':
        message = 'Invalid payment details';
        break;
      case 'StripeAPIError':
        message = 'Network error, please try again';
        break;
      case 'StripeConnectionError':
        message = 'Network error, please try again';
        break;
      case 'StripeAuthenticationError':
        console.error('Stripe API key error:', error);
        message = 'Payment service configuration error';
        break;
      default:
        console.error('Other Stripe error:', error);
        message = 'An error occurred with the payment';
    }
  }
  
  return { error: message };
};

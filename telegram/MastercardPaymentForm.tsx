import React, { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from './ui-components';
import {
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  validateCardDetails,
  getCardBrand,
  maskCardNumber,
  processMastercardPayment,
  MastercardPaymentData
} from '../services/mastercard-payment-service';
import { toast } from './toast';

interface MastercardPaymentFormProps {
  amount: number;
  currency?: string;
  botName: string;
  userName: string;
  userEmail: string;
  userId: string;
  onPaymentInitiated?: (transactionData: any) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
}

/**
 * Mastercard Payment Form Component
 * Captures card details and initiates payment process
 */
export default function MastercardPaymentForm({
  amount,
  currency = 'USD',
  botName,
  userName,
  userEmail,
  userId,
  onPaymentInitiated,
  onError,
  onBack
}: MastercardPaymentFormProps) {
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showCVV, setShowCVV] = useState(false);
  const [cardBrand, setCardBrand] = useState<string>('');

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    }

    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required';
    }

    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Expiry year is required';
    }

    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    }

    const cardValidation = validateCardDetails(
      formData.cardNumber,
      formData.expiryMonth,
      formData.expiryYear,
      formData.cvv
    );

    if (!cardValidation.valid) {
      newErrors.cardNumber = cardValidation.error || 'Invalid card details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle card number change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();

    setFormData({ ...formData, cardNumber: formatted.substring(0, 19) });

    if (value.length >= 1) {
      const brand = getCardBrand(value);
      setCardBrand(brand);
    } else {
      setCardBrand('');
    }

    if (errors.cardNumber) {
      setErrors({ ...errors, cardNumber: '' });
    }
  };

  // Handle expiry month change
  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, expiryMonth: e.target.value });
    if (errors.expiryMonth) {
      setErrors({ ...errors, expiryMonth: '' });
    }
  };

  // Handle expiry year change
  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, expiryYear: e.target.value });
    if (errors.expiryYear) {
      setErrors({ ...errors, expiryYear: '' });
    }
  };

  // Handle CVV change
  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setFormData({ ...formData, cvv: value });
    if (errors.cvv) {
      setErrors({ ...errors, cvv: '' });
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please check your card details and try again.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        userId,
        userEmail,
        userName,
        botName,
        botPrice: amount,
        currency,
        paymentDetails: {
          cardholderName: formData.cardholderName,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear,
          cvv: formData.cvv,
          amount,
          currency
        }
      };

      const response = await processMastercardPayment(paymentData);

      if (response.success) {
        toast({
          title: 'Payment Processed',
          description: 'OTP has been sent to your phone. Please enter it to confirm.',
          variant: 'default'
        });

        onPaymentInitiated?.({
          transactionId: response.transactionId,
          cardLastFour: formData.cardNumber.slice(-4),
          userId,
          botName
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Failed to process payment';
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive'
      });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header */}
        <CardHeader className="space-y-4 pb-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CreditCard className="h-6 w-6 text-green-500" />
                </div>
                Mastercard Payment
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter your card details to purchase {botName}
              </CardDescription>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 text-sm">Product</span>
              <span className="font-semibold text-white">{botName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Total Amount</span>
              <span className="text-2xl font-bold text-green-500">
                {currency} {amount.toFixed(2)}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Form */}
        <CardContent className="pt-6">
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName" className="text-slate-300">
                Cardholder Name
              </Label>
              <Input
                id="cardholderName"
                type="text"
                placeholder="John Doe"
                value={formData.cardholderName}
                onChange={(e) => {
                  setFormData({ ...formData, cardholderName: e.target.value });
                  if (errors.cardholderName) {
                    setErrors({ ...errors, cardholderName: '' });
                  }
                }}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                disabled={loading}
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.cardholderName}
                </p>
              )}
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-slate-300">
                Card Number
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="5555 5555 5555 4444"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-12"
                  disabled={loading}
                />
                {cardBrand && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs font-semibold text-green-500 uppercase">
                      {cardBrand}
                    </span>
                  </div>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.cardNumber}
                </p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth" className="text-slate-300">
                  Expiry Month
                </Label>
                <select
                  id="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleExpiryMonthChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="">Select Month</option>
                  {monthOptions.map((month) => (
                    <option key={month} value={String(month).padStart(2, '0')}>
                      {String(month).padStart(2, '0')} - {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                {errors.expiryMonth && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.expiryMonth}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYear" className="text-slate-300">
                  Expiry Year
                </Label>
                <select
                  id="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleExpiryYearChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="">Select Year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.expiryYear && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.expiryYear}
                  </p>
                )}
              </div>
            </div>

            {/* CVV */}
            <div className="space-y-2">
              <Label htmlFor="cvv" className="text-slate-300">
                CVV
              </Label>
              <div className="relative">
                <Input
                  id="cvv"
                  type={showCVV ? 'text' : 'password'}
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleCVVChange}
                  maxLength={4}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCVV(!showCVV)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  disabled={loading}
                >
                  {showCVV ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.cvv && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.cvv}
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <Lock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300">
                  <strong>Secure Payment</strong>
                  <br />
                  Your card details are encrypted and sent directly to our secure payment processor. We never store your full card details.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1"
                >
                  Go Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2">⟳</div>
                    Processing...
                  </>
                ) : (
                  <>
                    Make Payment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="mt-6 flex justify-center gap-8 px-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          SSL Encrypted
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          PCI Compliant
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Secure Processing
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Clock, ShieldCheck, Lock, Unlock, AlertCircle, 
  CheckCircle2, Send, X, Copy, ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react';
import { ADMIN_WHATSAPP, ADMIN_TELEGRAM_URL } from '../lib/constants';

export interface PoolPackage {
  id: string;
  name: string;
  description: string;
  duration_value: number;
  duration_unit: 'hours' | 'days';
  min_amount: number;
  max_amount?: number;
  roi_percentage: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface Investment {
  id: string;
  package_name: string;
  invested_amount: number;
  expected_return: number;
  total_payout: number;
  start_date: string;
  maturity_date: string;
  status: 'active' | 'matured' | 'withdrawal_pending' | 'withdrawn' | 'rejected' | 'pending';
  rejection_reason?: string;
}

export interface ApplicationHistoryItem {
  id: string;
  date: string;
  package_name: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  rejection_reason?: string;
}

export function PoolTradingDashboard() {
  const [activeTab, setActiveTab] = useState<'packages' | 'my-investments' | 'history'>('packages');

  // User verification status mock
  const [userEmailVerified, setUserEmailVerified] = useState(true);
  const [userName, setUserName] = useState('Alex Vance');
  const [userEmail, setUserEmail] = useState('alex.vance@forexelites.com');

  // Package Data
  const [packages, setPackages] = useState<PoolPackage[]>([
    {
      id: 'pkg_1',
      name: '24-Hour Starter Plan',
      description: 'Ideal for quick liquidity testing and short term scalp returns.',
      duration_value: 24,
      duration_unit: 'hours',
      min_amount: 100,
      max_amount: 1000,
      roi_percentage: 8.5,
      risk_level: 'low'
    },
    {
      id: 'pkg_2',
      name: '7-Day Growth Plan',
      description: 'Balanced risk-reward pool managed by senior institutional traders.',
      duration_value: 7,
      duration_unit: 'days',
      min_amount: 500,
      max_amount: 5000,
      roi_percentage: 24.0,
      risk_level: 'medium'
    },
    {
      id: 'pkg_3',
      name: '30-Day VIP Syndicate',
      description: 'Maximum compound yields targeting high-tier trend continuation setups.',
      duration_value: 30,
      duration_unit: 'days',
      min_amount: 2500,
      roi_percentage: 65.0,
      risk_level: 'high'
    }
  ]);

  // Selected Package Modal
  const [selectedPackage, setSelectedPackage] = useState<PoolPackage | null>(null);
  const [calcAmount, setCalcAmount] = useState<number>(500);

  // Application submission flow state
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Investments Data
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: 'inv_101',
      package_name: '7-Day Growth Plan',
      invested_amount: 500.00,
      expected_return: 120.00,
      total_payout: 620.00,
      start_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      maturity_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
      status: 'active'
    },
    {
      id: 'inv_102',
      package_name: '24-Hour Starter Plan',
      invested_amount: 250.00,
      expected_return: 21.25,
      total_payout: 271.25,
      start_date: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      maturity_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      status: 'matured'
    }
  ]);

  const [investmentFilter, setInvestmentFilter] = useState<'all' | 'active' | 'matured' | 'rejected'>('all');

  // Withdrawal Modal State
  const [selectedInvestmentForWithdraw, setSelectedInvestmentForWithdraw] = useState<Investment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH' | 'LTC'>('USDT_TRC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);

  // History Data
  const [historyItems, setHistoryItems] = useState<ApplicationHistoryItem[]>([
    {
      id: 'app_901',
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toLocaleDateString(),
      package_name: '7-Day Growth Plan',
      amount: 500.00,
      status: 'approved'
    },
    {
      id: 'app_902',
      date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toLocaleDateString(),
      package_name: '30-Day VIP Syndicate',
      amount: 2500.00,
      status: 'pending'
    }
  ]);

  // Real-time ticking effect
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenDetailModal = (pkg: PoolPackage) => {
    setSelectedPackage(pkg);
    setCalcAmount(pkg.min_amount);
    setSubmitError(null);
  };

  const handleInitialSubmitClick = () => {
    if (!userEmailVerified) {
      setSubmitError('Please verify your email before applying.');
      return;
    }
    setSubmitError(null);
    setIsSubmitConfirmOpen(true);
  };

  const handleConfirmApplication = () => {
    if (!selectedPackage) return;

    const expectedReturn = (calcAmount * selectedPackage.roi_percentage) / 100;
    const newSubmission = {
      package_name: selectedPackage.name,
      amount: calcAmount,
      expected_return: expectedReturn,
      date: new Date().toLocaleDateString(),
      status: 'Pending Review'
    };

    setHistoryItems([
      {
        id: `app_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        package_name: selectedPackage.name,
        amount: calcAmount,
        status: 'pending'
      },
      ...historyItems
    ]);

    setSubmissionSuccess(newSubmission);
    setIsSubmitConfirmOpen(false);
  };

  const validateWalletAddress = (method: string, address: string) => {
    if (!address) return 'Wallet address is required.';
    if (method === 'USDT_TRC20') {
      if (!address.startsWith('T') || address.length !== 34) {
        return 'TRC20 addresses must start with "T" and be exactly 34 characters.';
      }
    } else if (method === 'USDT_ERC20') {
      if (!address.startsWith('0x') || address.length !== 42) {
        return 'ERC20 addresses must start with "0x" and be exactly 42 characters.';
      }
    } else if (method === 'BTC') {
      if (address.length < 26 || address.length > 35) {
        return 'Bitcoin address length is invalid.';
      }
    }
    return null;
  };

  const handleWalletChange = (val: string) => {
    setWalletAddress(val);
    setWalletError(validateWalletAddress(paymentMethod, val));
  };

  const handlePaymentMethodChange = (val: any) => {
    setPaymentMethod(val);
    setWalletError(validateWalletAddress(val, walletAddress));
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateWalletAddress(paymentMethod, walletAddress);
    if (err) {
      setWalletError(err);
      return;
    }

    if (!selectedInvestmentForWithdraw) return;

    setInvestments(
      investments.map((inv) =>
        inv.id === selectedInvestmentForWithdraw.id ? { ...inv, status: 'withdrawal_pending' } : inv
      )
    );

    setSelectedInvestmentForWithdraw(null);
    setWalletAddress('');
    alert('Withdrawal request submitted successfully. You will receive funds within 24 hours.');
  };

  const adminWhatsappNumber = ADMIN_WHATSAPP;
  const whatsappUrl = `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(
    `Hi, I'm ${userName} (${userEmail}). I just submitted an application for ${submissionSuccess?.package_name} ($${submissionSuccess?.amount}).`
  )}`;
  const telegramUrl = ADMIN_TELEGRAM_URL;

  return (
    <div className="text-slate-700 font-sans pb-6">
      {/* ── PAGE HEADER ───────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 md:pb-4">
        <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
          Pool Trading
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Institutional liquidity pools · Managed automated yields</p>
      </div>

      {/* ── TAB BAR ── full-bleed, scroll on mobile ─── */}
      <div className="flex overflow-x-auto no-scrollbar bg-slate-100 border-t border-b border-slate-200 px-3 py-1.5 gap-1">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition shrink-0 whitespace-nowrap ${
            activeTab === 'packages' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Packages
        </button>
        <button
          onClick={() => setActiveTab('my-investments')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition shrink-0 whitespace-nowrap ${
            activeTab === 'my-investments' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Investments
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
          Application History
        </button>
      </div>

      {/* PAGE CONTENT */}
      <div className="px-4 pt-4 md:pt-6 space-y-6">

      {/* SUCCESS FULL SCREEN OVERLAY */}
      {submissionSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-6">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Application Submitted!</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Your pool trading allocation request has been logged. Admin will review and activate your portfolio shortly.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-left">
              <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500">Package</span>
                <span className="font-bold text-slate-800">{submissionSuccess.package_name}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500">Investment Amount</span>
                <span className="font-bold text-blue-600 tabular-nums">${submissionSuccess.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500">Date Submitted</span>
                <span className="text-slate-700 font-medium">{submissionSuccess.date}</span>
              </div>
              <div className="flex justify-between text-sm items-center pt-1">
                <span className="text-slate-500">Status</span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-0.5 rounded-full text-xs font-semibold">
                  {submissionSuccess.status}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition text-sm"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp Admin</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Telegram Admin</span>
              </a>
            </div>

            <button
              onClick={() => setSubmissionSuccess(null)}
              className="text-xs text-slate-400 font-medium underline hover:text-slate-600"
            >
              Return to Pool Trading
            </button>
          </div>
        </div>
      )}

      {/* PAGE 1: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-card">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">Compound Capital in Managed Institutional Pools</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Pool trading enables retail traders to aggregate capital into algorithmic high-frequency portfolios. Choose a duration plan below and start earning target returns.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const topAccentBar = 
                pkg.risk_level === 'low' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                pkg.risk_level === 'medium' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                'bg-gradient-to-r from-amber-500 to-amber-400';

              const riskBadge =
                pkg.risk_level === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                pkg.risk_level === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={pkg.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-card card-hover group"
                >
                  <div className={`h-1.5 w-full ${topAccentBar}`} />

                  <div className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {pkg.duration_value} {pkg.duration_unit}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mt-2">{pkg.name}</h3>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${riskBadge}`}>
                        {pkg.risk_level} Risk
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Expected Return</span>
                        <span className="text-emerald-600 font-bold tabular-nums">+{pkg.roi_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Min Investment</span>
                        <span className="text-slate-800 font-bold tabular-nums">${pkg.min_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => handleOpenDetailModal(pkg)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition text-sm flex items-center justify-center space-x-2"
                    >
                      <span>View Details & Apply</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PAGE 3: MY INVESTMENTS DASHBOARD */}
      {activeTab === 'my-investments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Active & Past Investments</h2>

            <div className="flex bg-slate-200/70 p-1 rounded-lg border border-slate-200 text-xs">
              {(['all', 'active', 'matured', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setInvestmentFilter(filter)}
                  className={`px-3 py-1 rounded-md capitalize font-semibold transition ${
                    investmentFilter === filter ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investments
              .filter((inv) => investmentFilter === 'all' || inv.status === investmentFilter)
              .map((inv) => {
                const startTime = new Date(inv.start_date).getTime();
                const matTime = new Date(inv.maturity_date).getTime();
                const totalDuration = Math.max(1, matTime - startTime);
                const elapsedTime = Math.max(0, Math.min(totalDuration, nowTime - startTime));
                const progressPct = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));

                const isMatured = nowTime >= matTime || inv.status === 'matured';
                const msRemaining = Math.max(0, matTime - nowTime);
                const daysRemaining = Math.floor(msRemaining / (1000 * 3600 * 24));
                const hoursRemaining = Math.floor((msRemaining % (1000 * 3600 * 24)) / (1000 * 3600));
                const minsRemaining = Math.floor((msRemaining % (1000 * 3600)) / (1000 * 60));

                return (
                  <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-card">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-800 text-base">{inv.package_name}</h3>
                      {inv.status === 'active' && (
                        <span className="flex items-center space-x-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-full font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
                          <span>Active — Growing</span>
                        </span>
                      )}
                      {inv.status === 'matured' && (
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-0.5 rounded-full font-bold">
                          Matured — Ready to Withdraw
                        </span>
                      )}
                      {inv.status === 'withdrawal_pending' && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-0.5 rounded-full font-semibold">
                          Withdrawal Pending
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Invested Amount</span>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">${inv.invested_amount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expected Return</span>
                        <p className="text-xl font-bold text-emerald-600 tabular-nums">+${inv.expected_return.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Progress</span>
                        <span className="tabular-nums">{progressPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* COUNTDOWN */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center space-x-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Time Remaining:</span>
                        </span>
                        <span className="tabular-nums font-bold text-slate-800">
                          {isMatured ? 'Matured' : `${daysRemaining}d ${hoursRemaining}h ${minsRemaining}m`}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] text-right font-medium">
                        Matures on: {new Date(inv.maturity_date).toLocaleString()}
                      </div>
                    </div>

                    {/* WITHDRAW BUTTON */}
                    <div>
                      {inv.status === 'matured' ? (
                        <button
                          onClick={() => setSelectedInvestmentForWithdraw(inv)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-blue-glow transition flex items-center justify-center space-x-2 text-sm"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Withdraw Now</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          title={`Available after ${new Date(inv.maturity_date).toLocaleString()}`}
                          className="w-full bg-slate-100 text-slate-400 font-medium py-2.5 rounded-lg border border-slate-200 cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Locked until {new Date(inv.maturity_date).toLocaleDateString()}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* PAGE 4: APPLICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Application Audit Log</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Package</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 tabular-nums text-xs text-slate-500">{item.date}</td>
                    <td className="p-4 font-semibold text-slate-800">{item.package_name}</td>
                    <td className="p-4 tabular-nums font-bold text-slate-900">${item.amount.toFixed(2)}</td>
                    <td className="p-4">
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center space-x-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-0.5 rounded-full font-semibold">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Waiting for Admin Review</span>
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-full font-semibold">
                          Approved
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <div className="space-y-1">
                          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-0.5 rounded-full font-semibold">
                            Rejected
                          </span>
                          {item.rejection_reason && (
                            <p className="text-xs text-red-600">{item.rejection_reason}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL & CALCULATOR MODAL */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">{selectedPackage.name}</h3>
              <button onClick={() => setSelectedPackage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">{selectedPackage.description}</p>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">Duration</span>
                  <p className="text-slate-800 font-bold mt-0.5">{selectedPackage.duration_value} {selectedPackage.duration_unit}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider">ROI Yield</span>
                  <p className="text-emerald-600 font-bold tabular-nums mt-0.5">+{selectedPackage.roi_percentage}%</p>
                </div>
              </div>

              {/* CALCULATOR */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700">Investment Amount ($)</label>
                <input
                  type="number"
                  min={selectedPackage.min_amount}
                  max={selectedPackage.max_amount || 100000}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 tabular-nums text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="flex justify-between text-xs pt-2 font-medium">
                  <span className="text-slate-500">Estimated Payout:</span>
                  <span className="text-emerald-600 font-bold tabular-nums">
                    ${(calcAmount + (calcAmount * selectedPackage.roi_percentage) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedPackage(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInitialSubmitClick}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition shadow-sm"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM APPLICATION MODAL */}
      {isSubmitConfirmOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl relative">
            <h3 className="text-lg font-bold text-slate-900">Confirm Application</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are applying for <strong className="text-slate-900">{selectedPackage.name}</strong> with an investment of{' '}
              <strong className="text-blue-600 tabular-nums">${calcAmount.toFixed(2)}</strong>.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsSubmitConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApplication}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-sm"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {selectedInvestmentForWithdraw && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Withdraw Your Earnings</h3>
              <button onClick={() => setSelectedInvestmentForWithdraw(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Invested: ${selectedInvestmentForWithdraw.invested_amount.toFixed(2)}</span>
                  <span>Earnings: +${selectedInvestmentForWithdraw.expected_return.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200/60 mt-1">
                  <span>Total Payout:</span>
                  <span className="text-emerald-600 tabular-nums">${selectedInvestmentForWithdraw.total_payout.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="USDT_TRC20">USDT (TRC20)</option>
                  <option value="USDT_ERC20">USDT (ERC20)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="LTC">Litecoin (LTC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paste your {paymentMethod} Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => handleWalletChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Paste wallet address..."
                  required
                />
                {walletError && <p className="text-xs text-red-600 mt-1 font-medium">{walletError}</p>}
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>Double-check your wallet address. Incorrect addresses will result in permanent loss of funds.</span>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvestmentForWithdraw(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!walletAddress || !!walletError}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition shadow-sm"
                >
                  Submit Withdrawal Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>{/* end content wrapper */}
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu as Bot,
    ShieldCheck,
    Zap,
    Target,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Download,
    Terminal,
    Cpu,
    Activity,
    Lock,
    Clock
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabase/client';

interface BotStoreProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
    onNavigateToPurchase?: () => void;
}

const BotStore: React.FC<BotStoreProps> = ({ user, onUpdateUser, onNavigateToPurchase }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async () => {
        try {
            setLoading(true);
            setError(null);

            if (onNavigateToPurchase) {
                onNavigateToPurchase();
            } else {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ bot_purchase_status: 'pending' })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                onUpdateUser({
                    ...user,
                    botPurchaseStatus: 'pending'
                });
            }
        } catch (err: any) {
            console.error('Error initiating purchase:', err);
            setError(err.message || 'Failed to initiate purchase. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isPending = user.botPurchaseStatus === 'pending';
    const hasAccess = user.botAccess || user.botPurchaseStatus === 'completed';

    return (
        <div className="space-y-0 md:space-y-10 pb-24 font-sans text-slate-700">

            {/* Hero Header Light Aesthetic */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 md:p-14 shadow-card">
                <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-50/80 blur-[100px]" />
                <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-50/80 blur-[100px]" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 tracking-wider uppercase"
                        >
                            <Zap className="h-4 w-4" />
                            Algorithmic Supremacy
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900"
                        >
                            Maichez <br />
                            <span className="text-blue-600">
                                Alpha-V5
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-600 max-w-xl leading-relaxed font-normal"
                        >
                            The world's first CRT-integrated MQL5 algorithm. Master the institutional flow with surgical precision and smart risk management.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4 pt-2"
                        >
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span className="text-slate-800 font-semibold text-sm">Institutional Proofed</span>
                            </div>
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span className="text-slate-800 font-semibold text-sm">Zero Martingale</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="md:w-1/3 flex justify-center relative group">
                        <div className="absolute inset-0 bg-blue-100/50 blur-3xl rounded-full" />
                        <motion.div
                            animate={{
                                y: [0, -12, 0],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative bg-white p-10 rounded-3xl border border-slate-200 shadow-xl"
                        >
                            <Bot className="h-32 w-32 text-blue-600" />
                            <div className="absolute -bottom-3 -right-3 h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                <Cpu className="h-6 w-6 text-white" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Specifications Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-card relative overflow-hidden">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
                                <Terminal className="h-5 w-5 text-blue-600" />
                            </div>
                            Technical Specifications
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { title: "Execution Logic", value: "3ms Latency", icon: Zap, desc: "High-frequency DMA execution" },
                                { title: "Asset Focus", value: "NAS100 / Gold", icon: Target, desc: "Liquid market specialization" },
                                { title: "Risk Engine", value: "Dynamic Shield", icon: ShieldCheck, desc: "Auto-adjusting position sizing" },
                                { title: "Synchronization", value: "CTR Full-Link", icon: Cpu, desc: "Real-time portal metadata sync" }
                            ].map((spec, i) => (
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    key={i}
                                    className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all duration-200"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs flex-shrink-0">
                                        <spec.icon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{spec.title}</div>
                                        <div className="text-lg font-bold text-slate-900">{spec.value}</div>
                                        <div className="text-[11px] text-slate-500 font-medium">{spec.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 rounded-xl bg-blue-50/60 border border-blue-100">
                            <p className="text-slate-700 italic text-base leading-relaxed font-medium">
                                "Alpha-V5 doesn't just chase price; it anticipates institutional displacement. By analyzing the CRT data stream, it waits for the high-probability 'sweet spot' before executing."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pricing Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-8 shadow-card relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200 mb-6">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse-dot" />
                                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Institutional License</span>
                            </div>

                            <div className="space-y-1 mb-6">
                                <div className="text-5xl font-extrabold text-slate-900 tracking-tight tabular-nums">$299</div>
                                <div className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Lifetime Access Bundle</div>
                            </div>

                            <div className="space-y-3 mb-8">
                                {[
                                    "100% Unlimited Usage",
                                    "MT5 Alpha-V5 Logic Engine",
                                    "Lifetime Algorithmic Updates",
                                    "Institutional Set Files",
                                    "Private Alpha-Chat Access"
                                ].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>

                            {hasAccess ? (
                                <button
                                    disabled
                                    className="w-full py-3.5 bg-slate-100 text-slate-500 font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed uppercase tracking-wider text-sm"
                                >
                                    <ShieldCheck className="h-5 w-5" />
                                    Account Authorized
                                </button>
                            ) : isPending ? (
                                <div className="space-y-3">
                                    <div className="w-full py-3 bg-amber-50 text-amber-700 font-semibold rounded-lg flex items-center justify-center gap-2 border border-amber-200 uppercase tracking-wider text-xs">
                                        <Clock className="h-4 w-4" />
                                        Ready to Purchase
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => onNavigateToPurchase?.()}
                                        disabled={loading}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-blue-glow transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-5 w-5 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span>💳 Make Purchase</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handlePurchase}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-blue-glow transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 animate-spin" />
                                            <span>Engaging...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-bold">💳 Make Purchase</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </motion.button>
                            )}

                            {error && (
                                <p className="mt-4 p-3 bg-red-50 border border-red-200 text-xs text-red-600 text-center font-medium rounded-lg">
                                    <AlertCircle className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reassurance Footer */}
            <div className="flex flex-col items-center justify-center pt-6 pb-4 text-center space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-blue-600" /> Institutional Grade Encryption
                </div>
                <p className="text-xs text-slate-400">
                    © 2026 Maichez Algorithmic Solutions. All institutional logic protected.
                </p>
            </div>
        </div>
    );
};

export default BotStore;

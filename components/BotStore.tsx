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

            // Navigate to the purchase page
            if (onNavigateToPurchase) {
                onNavigateToPurchase();
            } else {
                // Fallback: update database status if no navigation handler provided
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
        <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 animate-in fade-in ease-in-out duration-1000">
            {/* Dark Hero Header - Institutional Aesthetic */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 p-10 md:p-20 shadow-2xl">
                {/* Enhanced background glows */}
                <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-primary/10 blur-[120px]" />
                <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-blue-600/5 blur-[120px]" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 rounded-full bg-brand-primary/5 px-5 py-2 text-sm font-black text-brand-primary border border-brand-primary/20 tracking-widest shadow-inner uppercase"
                        >
                            <Zap className="h-4 w-4" />
                            Algorithmic Supremacy
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-8xl font-black tracking-tighter leading-none text-white"
                        >
                            Maichez <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-emerald-400 to-teal-400">
                                Alpha-V5
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium"
                        >
                            The world's first CRT-integrated MQL5 algorithm. Master the institutional flow with surgical precision and smart risk management.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-6 pt-4"
                        >
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                                <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                                <span className="text-white font-bold text-sm tracking-tight">Institutional Proofed</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                                <CheckCircle2 className="h-5 w-5 text-brand-primary" />
                                <span className="text-white font-bold text-sm tracking-tight">Zero Martingale</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="md:w-1/3 flex justify-center relative group">
                        <div className="absolute inset-0 bg-brand-primary/20 blur-[80px] rounded-full group-hover:bg-brand-primary/30 transition-all duration-700" />
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 2, 0]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative bg-slate-800/80 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/10 shadow-huge"
                        >
                            <Bot className="h-40 w-40 text-brand-primary drop-shadow-[0_0_15px_rgba(0,255,148,0.3)]" />
                            <div className="absolute -bottom-4 -right-4 h-14 w-14 bg-brand-primary rounded-full flex items-center justify-center border-8 border-slate-900 shadow-xl shadow-brand-primary/20">
                                <Cpu className="h-7 w-7 text-slate-900" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Stats & Features - Glassmorphism */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-10 md:p-14 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full" />

                        <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner">
                                <Terminal className="h-7 w-7 text-brand-primary" />
                            </div>
                            Technical Specifications
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "Execution Logic", value: "3ms Latency", icon: Zap, desc: "High-frequency DMA execution" },
                                { title: "Asset Focus", value: "NAS100 / Gold", icon: Target, desc: "Liquid market specialization" },
                                { title: "Risk Engine", value: "Dynamic Shield", icon: ShieldCheck, desc: "Auto-adjusting position sizing" },
                                { title: "Synchronization", value: "CTR Full-Link", icon: Cpu, desc: "Real-time portal metadata sync" }
                            ].map((spec, i) => (
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    key={i}
                                    className="flex items-start gap-5 p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-brand-primary/30 transition-all duration-300 group/item"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center shadow-lg group-hover/item:border-brand-primary/20 transition-colors">
                                        <spec.icon className="h-6 w-6 text-brand-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-slate-500 font-black uppercase tracking-widest">{spec.title}</div>
                                        <div className="text-xl font-black text-white">{spec.value}</div>
                                        <div className="text-[10px] text-slate-600 font-bold uppercase">{spec.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent border border-brand-primary/10 group-hover:border-brand-primary/20 transition-all duration-500">
                            <p className="text-slate-300 leading-relaxed italic text-lg font-medium">
                                "Alpha-V5 doesn't just chase price; it anticipates institutional displacement. By analyzing the CRT data stream, it waits for the high-probability 'sweet spot' before executing."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ultimate Pricing Card - Premium Holographic UI */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-slate-900 border-2 border-brand-primary/30 rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,255,148,0.1)] relative overflow-hidden group">
                        {/* Animated gradient border glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full border border-brand-primary/30 mb-6">
                                <div className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Institutional License</span>
                            </div>

                            <div className="space-y-1 mb-8">
                                <div className="text-6xl font-black text-white tracking-tighter">$299</div>
                                <div className="text-slate-500 font-black text-sm uppercase tracking-widest">Lifetime Access Bundle</div>
                            </div>

                            <div className="space-y-4 mb-10">
                                {[
                                    "100% Unlimited Usage",
                                    "MT5 Alpha-V5 Logic Engine",
                                    "Lifetime Algorithmic Updates",
                                    "Institutional Set Files",
                                    "Private Alpha-Chat Access"
                                ].map((f, i) => (
                                    <div key={i} className="flex items-center gap-4 text-slate-300 font-bold text-sm group/feature">
                                        <div className="h-6 w-6 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center group-hover/feature:bg-brand-primary/20 transition-colors">
                                            <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>

                            {hasAccess ? (
                                <button
                                    disabled
                                    className="w-full py-6 bg-white/5 text-slate-500 font-black rounded-2xl border border-white/5 flex items-center justify-center gap-3 backdrop-blur-sm cursor-not-allowed uppercase tracking-widest"
                                >
                                    <ShieldCheck className="h-6 w-6" />
                                    Account Authorized
                                </button>
                            ) : isPending ? (
                                <div className="space-y-4">
                                    <div className="w-full py-6 bg-amber-500/10 text-amber-500 font-black rounded-2xl flex items-center justify-center gap-3 border border-amber-500/20 backdrop-blur-sm uppercase tracking-widest">
                                        <Clock className="h-6 w-6" />
                                        Ready to Purchase
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onNavigateToPurchase?.()}
                                        disabled={loading}
                                        className="w-full py-6 bg-brand-primary text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(0,255,148,0.2)] hover:shadow-[0_15px_40px_rgba(0,255,148,0.4)] transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                                    >
                                        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <Activity className="h-6 w-6 animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-lg">💳 Make Purchase</span>
                                                <ArrowRight className="h-6 w-6 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </motion.button>
                                    <p className="text-center text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider bg-white/5 py-3 rounded-xl border border-white/5">
                                        Click to enter your payment details <br />
                                        and complete your purchase securely.
                                    </p>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handlePurchase}
                                    disabled={loading}
                                    className="w-full py-6 bg-brand-primary text-slate-900 font-black rounded-2xl shadow-[0_10px_30px_rgba(0,255,148,0.2)] hover:shadow-[0_15px_40px_rgba(0,255,148,0.4)] transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-6 w-6 animate-spin" />
                                            <span>Engaging...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-2xl font-black text-white drop-shadow-lg">💳 Make Purchase</span>
                                            <ArrowRight className="h-6 w-6 group-hover/btn:translate-x-1 transition-transform text-white" />
                                        </>
                                    )}
                                </motion.button>
                            )}

                            {error && (
                                <p className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-[10px] text-red-500 text-center font-black uppercase tracking-widest rounded-xl animate-shake">
                                    <AlertCircle className="h-4 w-4 inline-block mr-2 -mt-0.5" />
                                    {error}
                                </p>
                            )}

                            {/* Secure Payments Indicators */}
                            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
                                <div className="h-1 shadow-inner" />
                                <div className="flex items-center gap-6 saturate-0 group-hover:saturate-100 transition-all duration-700 brightness-75 group-hover:brightness-100">
                                    <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6 group-hover:scale-110 transition-transform" />
                                    <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6 group-hover:scale-110 transition-transform" />
                                    <img src="https://img.icons8.com/color/48/bitcoin.png" alt="Cardano" className="h-6 group-hover:scale-110 transition-transform invert group-hover:invert-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual reassurance footer */}
            <div className="flex flex-col items-center justify-center pt-10 pb-4 text-center space-y-4 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <ShieldCheck className="h-3 w-3 text-brand-primary" /> Institutional Grade Encryption
                </div>
                <p className="text-[10px] text-slate-600 font-bold max-w-xs uppercase tracking-widest">
                    © 2026 Maichez Algorithmic Solutions. <br /> All institutional logic protected by CRT licensing.
                </p>
            </div>
        </div>
    );
};

export default BotStore;

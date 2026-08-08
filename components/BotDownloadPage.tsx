import React, { useState, useEffect } from 'react';
import { User, BotAsset } from '../types';
import { fetchBotAssets } from '../services/adminService';
import {
    Cpu as Bot,
    Download,
    ShieldCheck,
    Zap,
    Server,
    Activity,
    CheckCircle2,
    FileCode,
    Lock,
    Clock,
    ArrowRight,
    FileText,
    Settings,
    Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BotDownloadPageProps {
    user: User;
}

const BotDownloadPage: React.FC<BotDownloadPageProps> = ({ user }) => {
    const isPending = user.botPurchaseStatus === 'pending';
    const [assets, setAssets] = useState<BotAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user.botAccess) {
            const loadAssets = async () => {
                try {
                    const data = await fetchBotAssets();
                    setAssets(data);
                } finally {
                    setLoading(false);
                }
            };
            loadAssets();
        }
    }, [user.botAccess]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'mql5': return Bot;
            case 'manual': return FileText;
            case 'preset': return Settings;
            default: return FileCode;
        }
    };

    const hasAccess = user.botAccess || user.botPurchaseStatus === 'completed';

    if (!hasAccess && !isPending) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,148,0.05)_0%,transparent_70%)] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-10"
                >
                    <div className="absolute inset-0 bg-brand-primary/20 blur-[100px] rounded-full" />
                    <div className="relative bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                        <Lock className="h-24 w-24 text-slate-600" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-3 -right-3 h-12 w-12 bg-brand-primary rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg shadow-brand-primary/40"
                        >
                            <Zap className="h-6 w-6 text-slate-900" />
                        </motion.div>
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black text-white mb-6 tracking-tight"
                >
                    Access <span className="text-brand-primary">Restricted</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 max-w-lg mx-auto mb-12 text-xl leading-relaxed"
                >
                    The Zeta Expert bot is an exclusive institutional algorithm. Experience the power of Maichez logic by unlocking your license today.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => window.dispatchEvent(new CustomEvent('navigateToView', { detail: 'bot' }))}
                    className="px-12 py-6 bg-brand-primary text-slate-900 font-black text-xl rounded-2xl hover:bg-green-400 transition-all shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/50 active:scale-95 flex items-center gap-4 group"
                >
                    Visit Bot Store <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-10"
                >
                    <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full" />
                    <div className="relative bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                        <Clock className="h-24 w-24 text-amber-500 animate-pulse" />
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black text-white mb-6 tracking-tight"
                >
                    Verification <span className="text-amber-500">In Progress</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 max-w-lg mx-auto mb-10 text-xl leading-relaxed"
                >
                    Our algorithmic specialists are validating your purchase credentials. Access to the Zeta ecosystem is granted momentarily.
                </motion.p>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-sm font-black uppercase tracking-[0.2em]">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Status: Pending Review
                </div>
            </div>
        );
    }

    const mainBotAsset = assets.find(a => a.type === 'mql5') || assets[0];

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-24 px-4 animate-in fade-in duration-1000">
            {/* Hero Section - Institutional Design */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16 p-10 md:p-20">
                    <div className="flex-1 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest shadow-inner"
                        >
                            <ShieldCheck className="h-4 w-4 text-brand-primary" />
                            Institutional Grade <span className="text-slate-500 ml-2">V5.0</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter"
                        >
                            Maichez <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-emerald-400 to-teal-400">
                                Zeta Expert
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-400 text-xl md:text-2xl max-w-xl leading-relaxed font-medium"
                        >
                            The ultimate CRT-integrated MQL5 algorithm. Engineered for institutional precision and consistent alpha generation.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-6 pt-6"
                        >
                            {mainBotAsset ? (
                                <a
                                    href={mainBotAsset.url}
                                    download={mainBotAsset.name}
                                    className="px-10 py-5 bg-brand-primary text-slate-900 font-black text-xl rounded-2xl hover:bg-green-400 transition-all shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 flex items-center gap-4 group active:scale-95"
                                >
                                    <Download className="h-7 w-7 transition-bounce" />
                                    Download Zeta Expert
                                </a>
                            ) : (
                                <div className="px-10 py-5 bg-white/5 text-slate-500 font-bold rounded-2xl border border-white/5 backdrop-blur-sm">
                                    Awaiting File Release
                                </div>
                            )}

                            <div className="flex items-center gap-6 px-4">
                                <div className="h-10 w-[1px] bg-white/10" />
                                <div className="space-y-1 text-center">
                                    <p className="text-white font-black text-lg leading-none">MQL5</p>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Platform</p>
                                </div>
                                <div className="h-10 w-[1px] bg-white/10" />
                                <div className="space-y-1 text-center">
                                    <p className="text-white font-black text-lg leading-none">V5.0</p>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Version</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bot Card 3D-ish Effect */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] rounded-full group-hover:bg-brand-primary/30 transition-all duration-700" />
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="relative bg-slate-800/80 backdrop-blur-xl p-12 rounded-[4rem] border border-white/10 shadow-huge"
                        >
                            <Bot className="h-40 w-40 text-brand-primary drop-shadow-[0_0_15px_rgba(0,255,148,0.3)]" />
                            <div className="absolute top-6 right-6 flex gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Assets & Info Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Available Assets */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-10 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full" />

                    <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                            <FileCode className="h-6 w-6 text-brand-primary" />
                        </div>
                        Secure Assets
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
                        ) : assets.length > 0 ? (
                            assets.map((asset) => {
                                const Icon = getIcon(asset.type);
                                return (
                                    <div key={asset.id} className="group bg-white/[0.03] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.08] hover:border-brand-primary/30 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 group-hover:border-brand-primary/20">
                                                <Icon className="h-6 w-6 text-brand-primary" />
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm tracking-tight">{asset.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{asset.version}</span>
                                                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                    <span className="text-[10px] text-brand-primary/60 font-black uppercase">{asset.fileSize}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={asset.url}
                                            download
                                            className="h-10 w-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-slate-900 transition-all duration-300 shadow-inner group-hover:shadow-brand-primary/20"
                                        >
                                            <Download className="h-5 w-5" />
                                        </a>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-2 text-center py-12 rounded-3xl bg-white/[0.02] border border-white/5 border-dashed">
                                <p className="text-slate-500 font-bold italic">No assets registered for your tier yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Algorithmic Configuration */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />

                    <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <Settings className="h-6 w-6 text-purple-400" />
                        </div>
                        Zeta Config
                    </h3>

                    <div className="space-y-6">
                        {[
                            { label: "Optimal Logic", value: "CRT V5.0" },
                            { label: "Execution", value: "High-Frequency" },
                            { label: "Drawdown Guard", value: "Strict 1.5%" },
                            { label: "Market Focus", value: "NAS100 / XAUUSD" },
                            { label: "Latency", value: "< 10ms" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">{item.label}</span>
                                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                    <span className="text-white font-black text-sm">{item.value}</span>
                                    <ShieldCheck className="h-3 w-3 text-brand-primary/40" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Installation Guide - Fixed Roadmap */}
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[3rem] p-12 md:p-20 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                        <Server className="h-32 w-32 text-brand-primary" />
                    </div>

                    <h2 className="text-4xl font-black text-white mb-16 flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <Activity className="h-8 w-8 text-slate-900" />
                        </div>
                        Installation Roadmap
                    </h2>

                    <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
                        {[
                            {
                                id: "01",
                                title: "Deploy to Experts",
                                desc: "Locate your MT5 Terminal Data Folder. Navigate to MQL5 > Experts and paste the Maichez Zeta .ex5 file.",
                                icon: FileCode
                            },
                            {
                                id: "02",
                                title: "Authorize Trading",
                                desc: "Open MT5 Tools > Options. Navigate to the 'EA' tab and ensure 'Allow Algo Trading' is strictly enabled.",
                                icon: Zap
                            },
                            {
                                id: "03",
                                title: "Initialize Setup",
                                desc: "Drag the EA onto your desired chart. Load the provided Institutional .set files for optimized logic.",
                                icon: Target
                            }
                        ].map((step, i) => (
                            <div key={i} className="relative group/step">
                                {/* Large background number for depth (not absolute positioned over text) */}
                                <div className="text-8xl font-black text-white/[0.03] absolute -top-12 -left-4 select-none group-hover/step:text-brand-primary/5 transition-colors duration-500">{step.id}</div>

                                <div className="relative z-10 space-y-6">
                                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/step:border-brand-primary/40 transition-all duration-300">
                                        <step.icon className="h-7 w-7 text-white group-hover/step:text-brand-primary transition-colors" />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-2xl font-black text-white tracking-tight">{step.title}</h4>
                                        <p className="text-slate-400 text-lg leading-relaxed font-medium">{step.desc}</p>
                                    </div>
                                </div>

                                {i < 2 && (
                                    <div className="hidden lg:block absolute -right-12 top-14">
                                        <ArrowRight className="h-8 w-8 text-white/5" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotDownloadPage;


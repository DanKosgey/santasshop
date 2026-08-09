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
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 relative overflow-hidden font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-8"
                >
                    <div className="relative bg-white p-10 rounded-3xl border border-slate-200 shadow-card">
                        <Lock className="h-20 w-20 text-slate-400" />
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight"
                >
                    Access <span className="text-blue-600">Restricted</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-600 max-w-lg mx-auto mb-8 text-base leading-relaxed"
                >
                    The Zeta Expert bot is an exclusive institutional algorithm. Experience the power of Maichez logic by unlocking your license today.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => window.dispatchEvent(new CustomEvent('navigateToView', { detail: 'bot' }))}
                    className="px-8 py-4 bg-blue-600 text-white font-bold text-base rounded-xl hover:bg-blue-700 transition-all shadow-blue-glow flex items-center gap-3 group"
                >
                    Visit Bot Store <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 relative overflow-hidden font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-8"
                >
                    <div className="relative bg-white p-10 rounded-3xl border border-slate-200 shadow-card">
                        <Clock className="h-20 w-20 text-amber-500 animate-pulse" />
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight"
                >
                    Verification <span className="text-amber-500">In Progress</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-600 max-w-lg mx-auto mb-8 text-base leading-relaxed"
                >
                    Our algorithmic specialists are validating your purchase credentials. Access to the Zeta ecosystem is granted momentarily.
                </motion.p>
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-bold uppercase tracking-wider">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Status: Pending Review
                </div>
            </div>
        );
    }

    const mainBotAsset = assets.find(a => a.type === 'mql5') || assets[0];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 font-sans text-slate-700 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-card p-8 md:p-14">
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider"
                        >
                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                            Institutional Grade <span className="text-slate-400 ml-1">V5.0</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight"
                        >
                            Maichez <br />
                            <span className="text-blue-600">
                                Zeta Expert
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-600 text-lg md:text-xl max-w-xl leading-relaxed font-normal"
                        >
                            The ultimate CRT-integrated MQL5 algorithm. Engineered for institutional precision and consistent alpha generation.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4 pt-4"
                        >
                            {mainBotAsset ? (
                                <a
                                    href={mainBotAsset.url}
                                    download={mainBotAsset.name}
                                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-lg transition-all shadow-blue-glow flex items-center gap-3 group"
                                >
                                    <Download className="h-5 w-5" />
                                    Download Zeta Expert
                                </a>
                            ) : (
                                <div className="px-8 py-3.5 bg-slate-100 text-slate-400 font-semibold rounded-lg border border-slate-200">
                                    Awaiting File Release
                                </div>
                            )}

                            <div className="flex items-center gap-4 px-4">
                                <div className="h-8 w-[1px] bg-slate-200" />
                                <div className="space-y-0.5 text-center">
                                    <p className="text-slate-900 font-bold text-sm">MQL5</p>
                                    <p className="text-slate-400 text-[10px] uppercase font-medium">Platform</p>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-200" />
                                <div className="space-y-0.5 text-center">
                                    <p className="text-slate-900 font-bold text-sm">V5.0</p>
                                    <p className="text-slate-400 text-[10px] uppercase font-medium">Version</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="relative group">
                        <motion.div
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative bg-slate-50 p-10 rounded-3xl border border-slate-200 shadow-md"
                        >
                            <Bot className="h-32 w-32 text-blue-600" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Assets & Info Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Available Assets */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-card relative overflow-hidden">
                    <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
                            <FileCode className="h-5 w-5 text-blue-600" />
                        </div>
                        Secure Assets
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {loading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)
                        ) : assets.length > 0 ? (
                            assets.map((asset) => {
                                const Icon = getIcon(asset.type);
                                return (
                                    <div key={asset.id} className="group bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                                <Icon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{asset.version}</span>
                                                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase">{asset.fileSize}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={asset.url}
                                            download
                                            className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-200"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-2 text-center py-10 rounded-xl bg-slate-50 border border-slate-200 border-dashed">
                                <p className="text-slate-400 font-medium italic text-sm">No assets registered for your tier yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Algorithmic Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-card relative overflow-hidden">
                    <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-200">
                            <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        Zeta Config
                    </h3>

                    <div className="space-y-4">
                        {[
                            { label: "Optimal Logic", value: "CRT V5.0" },
                            { label: "Execution", value: "High-Frequency" },
                            { label: "Drawdown Guard", value: "Strict 1.5%" },
                            { label: "Market Focus", value: "NAS100 / XAUUSD" },
                            { label: "Latency", value: "< 10ms" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{item.label}</span>
                                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex items-center justify-between">
                                    <span className="text-slate-800 font-bold text-sm">{item.value}</span>
                                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Installation Guide */}
            <div className="relative bg-white border border-slate-200 rounded-3xl p-8 md:p-14 shadow-card overflow-hidden">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-12 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
                        <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    Installation Roadmap
                </h2>

                <div className="grid md:grid-cols-3 gap-10">
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
                        <div key={i} className="relative space-y-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <step.icon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-slate-900">{step.title}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BotDownloadPage;


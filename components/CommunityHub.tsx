// Enhanced CommunityHub — Kenyan trader focused, animated, motivational, production-ready React component

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Twitter,
  Instagram,
  MessageCircle,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Lock,
  Send,
  Phone,
  Check,
  Star,
  Trophy,
  Sparkles,
  TrendingUp,
  Award,
  Globe,
  Heart
} from "lucide-react";
import { socialMediaService } from "../services/socialMediaService";
import { CommunityLink } from "../types";

interface CommunityHubProps {
  subscriptionTier?:
    | "free"
    | "foundation"
    | "professional"
    | "elite"
    | "elite-pending"
    | "foundation-pending"
    | "professional-pending"
    | null;
  userId?: string;
  onJoinCommunity?: (platform: string) => void;
}

const cx = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(" ");

const formatTierName = (tier?: string | null) => {
  if (!tier) return "Free";
  return tier.replace("-pending", "").replace(/(^|\s)\S/g, (t) => t.toUpperCase());
};

const LoadingCard: React.FC = () => (
  <div className="animate-pulse bg-slate-100 rounded-2xl p-6 h-40 border border-slate-200" />
);

const Confetti: React.FC<{ trigger: number }> = ({ trigger }) => {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full z-50" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.rect
          key={`${trigger}-${i}`}
          initial={{ y: -50, opacity: 0, rotate: 0 }}
          animate={{ y: [ -50, 600 + Math.random() * 200 ], opacity: [0.9, 0.6, 0], rotate: Math.random() * 360 }}
          transition={{ duration: 1.2 + Math.random() * 0.8, delay: Math.random() * 0.2 }}
          x={(i * 30) % 1200}
          y={-40}
          width={8 + (i % 4)}
          height={12 + (i % 6)}
          rx={2}
          fill="url(#g1)"
          style={{ transformOrigin: "center" }}
        />
      ))}
    </svg>
  );
};

const CommunityHub: React.FC<CommunityHubProps> = ({ subscriptionTier, userId, onJoinCommunity }) => {
  const [communityLinks, setCommunityLinks] = useState<CommunityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLoadingFor, setJoinLoadingFor] = useState<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const isPendingUser = !!(subscriptionTier && subscriptionTier.includes("-pending"));
  const hasPremiumAccess = !!subscriptionTier && !isPendingUser;

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const links = await socialMediaService.getCommunityLinks();
        if (!mounted) return;
        setCommunityLinks(links || []);
      } catch (err) {
        console.error(err);
        setError("Could not load community links. Try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  const premiumLinks = useMemo(
    () => communityLinks.filter((l) => ["telegram", "whatsapp"].includes(l.platformKey)),
    [communityLinks]
  );

  const socialLinks = useMemo(
    () => communityLinks.filter((l) => !["telegram", "whatsapp"].includes(l.platformKey)),
    [communityLinks]
  );

  const stats = useMemo(
    () => ({
      members: "200+",
      funded: "KES 6.8M",
      avgWinRate: 0.72,
    }),
    []
  );

  const handleJoinCommunity = async (link: CommunityLink) => {
    if (isPendingUser) {
      setToast("Your application is pending — approval required to join premium groups.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      setJoinLoadingFor(link.platformKey);
      setConfettiTrigger((t) => t + 1);
      setToast(`Welcome to ${link.platformName}! Opening...`);

      if (userId) {
        socialMediaService.updateLastCommunityPlatform(userId, link.platformKey).catch((e) => console.warn(e));
      }

      onJoinCommunity?.(link.platformKey);
      window.open(link.linkUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error(err);
      setToast("Could not open link. Try again.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setJoinLoadingFor(null);
    }
  };

  const getPlatformIcon = (platformKey: string) => {
    switch (platformKey) {
      case "telegram": return <Send className="h-5 w-5" />;
      case "whatsapp": return <Phone className="h-5 w-5" />;
      case "youtube": return <Youtube className="h-5 w-5" />;
      case "twitter": return <Twitter className="h-5 w-5" />;
      case "instagram": return <Instagram className="h-5 w-5" />;
      case "tiktok": return <MessageCircle className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <div className="text-slate-700 pb-16 space-y-0 md:space-y-8 font-sans">
      {/* ── PAGE HEADER ─────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Trading Community</span>
        </div>
        <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Connect with Fellow Traders</h1>
        <p className="text-sm text-slate-500 max-w-xl md:mx-auto">
          Real-time signals, shared strategies, and direct access to master traders.
        </p>
      </div>

      {/* ── STATS STRIP ── full-bleed 4-col ─────────── */}
      <section className="grid grid-cols-4 border-t border-b border-slate-200 bg-white divide-x divide-slate-200">
        <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
          <Users className="h-5 w-5 text-blue-600 mb-1" />
          <div className="text-xl font-bold text-slate-900 tabular-nums">{stats.members}</div>
          <div className="text-[10px] text-slate-400 font-medium">Members</div>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
          <TrendingUp className="h-5 w-5 text-emerald-600 mb-1" />
          <div className="text-xl font-bold text-slate-900 tabular-nums">{stats.funded}</div>
          <div className="text-[10px] text-slate-400 font-medium">Funded</div>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
          <Award className="h-5 w-5 text-purple-600 mb-1" />
          <div className="text-xl font-bold text-slate-900 tabular-nums">{(stats.avgWinRate * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-400 font-medium">Win Rate</div>
        </div>
        <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
          <Heart className="h-5 w-5 text-red-500 mb-1" />
          <div className="text-xl font-bold text-slate-900">24/7</div>
          <div className="text-[10px] text-slate-400 font-medium">Support</div>
        </div>
      </section>

      {/* Pending notice */}
      <AnimatePresence>
        {isPendingUser && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-4 bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="font-bold text-sm">Application under review — {formatTierName(subscriptionTier)}</div>
            </div>
            <div className="text-xs text-amber-700">You can participate in public discussions. Premium groups will unlock after approval.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Groups */}
      <section aria-labelledby="groups-heading" className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pt-4">
          <h2 id="groups-heading" className="text-lg md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Premium Groups
          </h2>
          <div className="text-xs font-medium text-slate-500">Exclusive communities for serious traders</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 font-medium">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {premiumLinks.map((link, index) => (
              <motion.article
                key={link.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cx(
                  "relative p-6 rounded-2xl border bg-white shadow-card card-hover border-slate-200",
                  isPendingUser && "opacity-80"
                )}
              >
                {isPendingUser && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-2xl z-10 flex flex-col items-center justify-center p-4">
                    <Lock className="h-6 w-6 mb-1 text-slate-500" />
                    <div className="text-slate-900 font-bold text-base text-center">Pending Approval</div>
                    <div className="text-xs text-slate-500 mt-0.5 text-center">Access unlocked after review</div>
                  </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl text-white shadow-xs" style={{ backgroundColor: link.iconColor }}>
                      {getPlatformIcon(link.platformKey)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{link.platformName}</h3>
                      <div className="text-sm text-slate-500 mt-0.5">{link.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleJoinCommunity(link)}
                      disabled={!!joinLoadingFor}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-blue-glow text-sm"
                    >
                      {joinLoadingFor === link.platformKey ? (
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" fill="none" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <>
                          <span>Join Group</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" /> 
                    <span>Trusted Signals & Analysis</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-emerald-600" /> 
                    <span>Top Traders & Mentors</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-purple-600" /> 
                    <span>Real-time Market Updates</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Social platforms */}
      <section className="px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pt-4">
          <h2 className="text-lg md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Connect Across Platforms
          </h2>
          <div className="text-xs font-medium text-slate-500">Follow for education & market commentary</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {socialLinks.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ translateY: -4 }}
                className="group p-5 rounded-xl border border-slate-200 bg-white flex flex-col shadow-card hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg text-white" style={{ backgroundColor: link.iconColor }}>
                    {getPlatformIcon(link.platformKey)}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="font-bold text-slate-900 text-base mb-1">{link.platformName}</div>
                <div className="text-xs text-slate-500 mb-3 line-clamp-2">{link.description}</div>
                <div className="mt-auto text-xs font-bold flex items-center gap-1 text-blue-600">
                  <span>Follow</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="text-center py-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50/50 p-8 rounded-2xl border border-blue-100 shadow-card"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Join Our Community?</h3>
          <p className="text-slate-600 text-sm mb-5">
            Connect with thousands of traders, get exclusive signals, and accelerate your trading success.
          </p>
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-blue-glow transition-all text-sm">
            Get Started Today
          </button>
        </motion.div>
      </section>

      {/* toast + confetti */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed left-4 right-4 sm:left-auto sm:right-6 bottom-6 bg-slate-900 text-white px-4 py-3 rounded-xl z-50 max-w-md mx-auto sm:mx-0 shadow-lg">
            <div className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {confettiTrigger > 0 && <Confetti trigger={confettiTrigger} />}
    </div>
  );
};

export default CommunityHub;
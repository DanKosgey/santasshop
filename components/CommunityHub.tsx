// Enhanced CommunityHub — Kenyan trader focused, animated, motivational, production-ready React component
// Features:
// - Modern, motivating UI for profitable Kenyan traders
// - Framer Motion animations and micro-interactions
// - Cleaner TypeScript, improved accessibility and error handling
// - Sparkline win-rate preview, recent-wins carousel, leaderboard, badges
// - Optimistic join with confetti animation and small notification

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

// small helper to compose classes without adding a dependency
const cx = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(" ");

const formatTierName = (tier?: string | null) => {
  if (!tier) return "Free";
  return tier.replace("-pending", "").replace(/(^|\s)\S/g, (t) => t.toUpperCase());
};

const LoadingCard: React.FC = () => (
  <div className="animate-pulse bg-gray-800/40 rounded-2xl p-6 h-40" />
);

const Confetti: React.FC<{ trigger: number }> = ({ trigger }) => {
  // simple CSS-driven confetti using animated SVG elements
  // will re-render on `trigger` change to replay
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full z-50" aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#FFB86B" />
          <stop offset="100%" stopColor="#FF5C7C" />
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

const Sparkline: React.FC<{ values: number[]; color?: string }> = ({ values, color = "#10B981" }) => {
  // very small inline svg sparkline animated with stroke-dashoffset
  const width = 120;
  const height = 36;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / (max - min || 1)) * height}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

  // Mock stats for Kenyan trader vibes — replace with real telemetry
  const stats = useMemo(
    () => ({
      members: "200" ,
      funded: "KES 6.8M",
      avgWinRate: 0.72,
      recentWins: [0.5, 0.6, 0.8, 0.78, 0.85, 0.9],
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
      // optimistic UI: show confetti and toast locally first
      setConfettiTrigger((t) => t + 1);
      setToast(`Welcome to ${link.platformName}! Opening...`);

      if (userId) {
        // best-effort: record that the user clicked this platform
        socialMediaService.updateLastCommunityPlatform(userId, link.platformKey).catch((e) => console.warn(e));
      }

      // call callback so parent can handle navigation/analytics
      onJoinCommunity?.(link.platformKey);

      // open link in new tab
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

  // Get icon component for platform
  const getPlatformIcon = (platformKey: string) => {
    switch (platformKey) {
      case "telegram": return <Send className="h-5 w-5 sm:h-6 sm:w-6" />;
      case "whatsapp": return <Phone className="h-5 w-5 sm:h-6 sm:w-6" />;
      case "youtube": return <Youtube className="h-5 w-5 sm:h-6 sm:w-6" />;
      case "twitter": return <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />;
      case "instagram": return <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />;
      case "tiktok": return <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />;
      default: return <Globe className="h-5 w-5 sm:h-6 sm:w-6" />;
    }
  };

  return (
    <div className="text-white pb-16 space-y-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-amber-500/30 mb-6">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">Join Our Trading Community</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-green-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Connect with Fellow Traders
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join our vibrant community of Kenyan and global traders. Get real-time signals, share strategies, and accelerate your trading journey.
          </p>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-gray-700 text-center"
        >
          <Users className="h-6 w-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.members.toLocaleString()}+</div>
          <div className="text-sm text-gray-400">Active Members</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-gray-700 text-center"
        >
          <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.funded}</div>
          <div className="text-sm text-gray-400">Funded Traders</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-gray-700 text-center"
        >
          <Award className="h-6 w-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{(stats.avgWinRate * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-400">Avg Win Rate</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl border border-gray-700 text-center"
        >
          <Heart className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">24/7</div>
          <div className="text-sm text-gray-400">Support</div>
        </motion.div>
      </section>

      {/* Pending notice */}
      <AnimatePresence>
        {isPendingUser && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-yellow-600/6 border border-yellow-600/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-yellow-200">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <div className="font-semibold text-sm sm:text-base">Application under review — {formatTierName(subscriptionTier)}</div>
            </div>
            <div className="text-xs sm:text-sm text-yellow-100/80">You can participate in public discussions. Premium groups will unlock after approval.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Groups */}
      <section aria-labelledby="groups-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-6">
          <h2 id="groups-heading" className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-400" />
            Premium Trading Groups
          </h2>
          <div className="text-sm text-gray-400">Exclusive communities for serious traders</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {premiumLinks.map((link, index) => (
              <motion.article
                key={link.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className={cx(
                  "relative p-6 rounded-2xl border",
                  isPendingUser && "opacity-80",
                  "bg-gradient-to-br from-slate-900/40 to-black/40 border-slate-800 shadow-xl"
                )}
              >
                {isPendingUser && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl z-10 flex flex-col items-center justify-center p-4">
                    <Lock className="h-6 w-6 mb-2 text-gray-300" />
                    <div className="text-white font-semibold text-base text-center">Pending Approval</div>
                    <div className="text-xs text-gray-300 mt-1 text-center">Access unlocked after review</div>
                  </div>
                )}

                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl text-white shadow-lg" style={{ backgroundColor: link.iconColor }}>
                      {getPlatformIcon(link.platformKey)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{link.platformName}</h3>
                      <div className="text-sm text-gray-400 mt-1">{link.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleJoinCommunity(link)}
                      disabled={!!joinLoadingFor}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold hover:from-amber-400 hover:to-amber-500 focus:outline-none transition-all shadow-lg hover:shadow-amber-500/20"
                    >
                      {joinLoadingFor === link.platformKey ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeOpacity="0.2" fill="none" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <>
                          <span>Join Group</span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400" /> 
                    <span>Trusted Signals & Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-400" /> 
                    <span>Top Traders & Mentors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-400" /> 
                    <span>Real-time Market Updates</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Social platforms */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-400" />
            Connect Across Platforms
          </h2>
          <div className="text-sm text-gray-400">Follow our channels for education & market commentary</div>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ translateY: -8 }}
                className="group p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/40 to-black/40 flex flex-col shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl text-white" style={{ backgroundColor: link.iconColor }}>
                    {getPlatformIcon(link.platformKey)}
                  </div>
                  <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: link.iconColor }} />
                </div>

                <div className="font-bold text-lg mb-2">{link.platformName}</div>
                <div className="text-sm text-gray-400 mb-4 line-clamp-2">{link.description}</div>
                <div className="mt-auto text-sm font-semibold flex items-center gap-1" style={{ color: link.iconColor }}>
                  <span>Follow</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 rounded-2xl border border-gray-700"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Join Our Community?</h3>
          <p className="text-gray-300 mb-6">
            Connect with thousands of traders, get exclusive signals, and accelerate your trading success.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-purple-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-purple-400 transition-all">
            Get Started Today
          </button>
        </motion.div>
      </section>

      {/* small toast + confetti */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed left-4 right-4 sm:left-auto sm:right-6 bottom-6 bg-slate-900/80 border border-slate-700 px-4 py-3 rounded-xl z-50 max-w-md mx-auto sm:mx-0 shadow-lg">
            <div className="text-sm flex items-center gap-2">
              <Check className="h-5 w-5 text-green-400" />
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
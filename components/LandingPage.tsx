import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, AnimatePresence, Variants, useInView } from 'framer-motion';
import { ArrowRight, Zap, Shield, TrendingUp, Play, Check, X, Star, Lock, AlertTriangle, CheckCircle, BarChart2, Rocket, Sparkles, Target, Users, Award, Clock, Cpu as Bot } from 'lucide-react';
import { socialMediaService } from '../services/socialMediaService';
import { SubscriptionPlan } from '../types';
import { APP_DISPLAY_NAMES, APP_MESSAGES } from '../lib/constants';

interface LandingPageProps {
  onSelectTier: (tier: 'free' | 'foundation' | 'professional' | 'elite' | 'login') => void;
  onPlanSelection?: (planName: string) => void;
}

// New Advanced Trading Animation Component
const TradingVisualization: React.FC<{ mode: 'bull' | 'bear' }> = ({ mode }) => {
  const controls = useAnimation();
  const [activeNodes, setActiveNodes] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNodes = Array.from({ length: 3 }, () => Math.floor(Math.random() * 8));
      setActiveNodes(newNodes);
      setTimeout(() => setActiveNodes([]), 800);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    });
  }, [controls]);

  return (
    <motion.div
      animate={controls}
      className="relative w-full h-48 flex items-center justify-center"
    >
      {/* Animated Network Grid */}
      <div className="absolute inset-0">
        {/* Main Network Lines */}
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mode === 'bull' ? "#06b6d4" : "#ef4444"} />
              <stop offset="100%" stopColor={mode === 'bull' ? "#10b981" : "#f97316"} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Network Grid */}
          {[
            // Horizontal lines
            { id: 1, d: "M20,20 L180,20" },
            { id: 2, d: "M20,50 L180,50" },
            { id: 3, d: "M20,80 L180,80" },
            // Vertical lines
            { id: 4, d: "M20,20 L20,80" },
            { id: 5, d: "M100,20 L100,80" },
            { id: 6, d: "M180,20 L180,80" },
            // Diagonal lines
            { id: 7, d: "M20,20 L180,80" },
            { id: 8, d: "M180,20 L20,80" }
          ].map((line) => (
            <motion.path
              key={line.id}
              d={line.d}
              stroke="url(#networkGradient)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: line.id * 0.2 }}
            />
          ))}

          {/* Network Nodes */}
          {[
            { id: 1, x: 20, y: 20 },
            { id: 2, x: 100, y: 20 },
            { id: 3, x: 180, y: 20 },
            { id: 4, x: 20, y: 50 },
            { id: 5, x: 100, y: 50 },
            { id: 6, x: 180, y: 50 },
            { id: 7, x: 20, y: 80 },
            { id: 8, x: 100, y: 80 },
            { id: 9, x: 180, y: 80 }
          ].map((node) => (
            <motion.g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill={mode === 'bull' ? "#06b6d4" : "#ef4444"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: node.id * 0.1, type: "spring" }}
              />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="8"
                fill={mode === 'bull' ? "#06b6d4" : "#ef4444"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: activeNodes.includes(node.id) ? [0, 1.5, 0] : 0,
                  opacity: activeNodes.includes(node.id) ? [0.5, 0.8, 0] : 0
                }}
                transition={{ duration: 0.8 }}
              />
            </motion.g>
          ))}

          {/* Central Trading Orb */}
          <motion.circle
            cx="100"
            cy="50"
            r="15"
            fill={`url(#networkGradient)`}
            filter="url(#glow)"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Data Streams */}
          <motion.g>
            {/* Incoming Data Streams */}
            {[...Array(6)].map((_, i) => (
              <motion.circle
                key={`in-${i}`}
                cx={-10}
                cy={15 + i * 15}
                r="2"
                fill={mode === 'bull' ? "#10b981" : "#ef4444"}
                initial={{ opacity: 0 }}
                animate={{
                  x: [0, 210],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}

            {/* Processed Data Streams */}
            {[...Array(6)].map((_, i) => (
              <motion.circle
                key={`out-${i}`}
                cx={100}
                cy={50}
                r="1.5"
                fill={mode === 'bull' ? "#06b6d4" : "#f97316"}
                initial={{ opacity: 1 }}
                animate={{
                  x: mode === 'bull' ? [0, 100] : [0, -100],
                  y: mode === 'bull' ? [0, -40] : [0, 40],
                  opacity: [1, 0.5, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.g>

          {/* Market Direction Indicator */}
          <motion.g
            animate={{
              y: mode === 'bull' ? [-5, 0, -5] : [5, 0, 5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <polygon
              points={mode === 'bull' ? "100,25 95,35 105,35" : "100,75 95,65 105,65"}
              fill={mode === 'bull' ? "#10b981" : "#ef4444"}
            />
            <motion.text
              x="100"
              y={mode === 'bull' ? "45" : "55"}
              textAnchor="middle"
              fill={mode === 'bull' ? "#10b981" : "#ef4444"}
              fontSize="8"
              fontWeight="bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {mode === 'bull' ? "BULL" : "BEAR"}
            </motion.text>
          </motion.g>
        </svg>
      </div>

      {/* Floating Analysis Elements */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute text-xs font-bold ${mode === 'bull' ? 'text-green-400' : 'text-red-400'
              }`}
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 60 + 20}%`,
            }}
            animate={{
              y: mode === 'bull'
                ? [0, -20 - Math.random() * 30, 0]
                : [0, 20 + Math.random() * 30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: Math.random() * 2
            }}
          >
            {mode === 'bull' ? '📈' : '📉'}
          </motion.div>
        ))}
      </div>

      {/* Pulse Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              borderColor: mode === 'bull' ? '#06b6d4' : '#ef4444',
              width: '80px',
              height: '80px',
            }}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{
              scale: [0.5, 2],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 1,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Status Display */}
      <motion.div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border"
        style={{
          borderColor: mode === 'bull' ? 'rgba(6,182,212,0.5)' : 'rgba(239,68,68,0.5)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-3 text-white text-sm font-bold">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{
              background: mode === 'bull' ? '#10b981' : '#ef4444',
            }}
            animate={{
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
          <span>MARKET {mode === 'bull' ? 'BULL' : 'BEAR'} MODE</span>
          <motion.span
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {mode === 'bull' ? '🚀' : '⚡'}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Market Vibe Visualization with new animation
const MarketVibeVisualization: React.FC<{ vibe: 'bull' | 'bear' }> = ({ vibe }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    });
  }, [controls]);

  return (
    <motion.div
      animate={controls}
      className="relative w-full h-48 flex items-center justify-center"
    >
      {/* Animated background with gradient mesh */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        animate={{
          background: vibe === 'bull'
            ? [
              'radial-gradient(circle at 20% 20%, rgba(6,182,212,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.2), transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(6,182,212,0.3), transparent 50%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.2), transparent 50%)',
              'radial-gradient(circle at 20% 20%, rgba(6,182,212,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.2), transparent 50%)'
            ]
            : [
              'radial-gradient(circle at 20% 20%, rgba(239,68,68,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.2), transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(239,68,68,0.3), transparent 50%), radial-gradient(circle at 20% 80%, rgba(249,115,22,0.2), transparent 50%)',
              'radial-gradient(circle at 20% 20%, rgba(239,68,68,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.2), transparent 50%)'
            ]
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(${vibe === 'bull' ? '#06b6d4' : '#ef4444'} 1px, transparent 1px),
                           linear-gradient(90deg, ${vibe === 'bull' ? '#06b6d4' : '#ef4444'} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Glow border effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: vibe === 'bull'
            ? 'inset 0 0 40px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.3)'
            : 'inset 0 0 40px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.3)'
        }}
        initial={false}
      />

      {/* New Trading Visualization */}
      <TradingVisualization mode={vibe} />
    </motion.div>
  );
};

// Enhanced Floating Particles with dynamic movement
const FloatingParticles: React.FC = () => {
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          initial={{ opacity: 0.3 }}
          style={{
            width: Math.random() * 25 + 5,
            height: Math.random() * 25 + 5,
            background: i % 4 === 0
              ? 'radial-gradient(circle, rgba(6,182,212,0.8), transparent)'
              : i % 4 === 1
                ? 'radial-gradient(circle, rgba(239,68,68,0.8), transparent)'
                : i % 4 === 2
                  ? 'radial-gradient(circle, rgba(255,213,79,0.8), transparent)'
                  : 'radial-gradient(circle, rgba(16,185,129,0.8), transparent)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: `blur(${Math.random() * 3 + 1}px)`,
          }}
          animate={{
            y: [0, (Math.random() - 0.5) * 120, 0],
            x: [0, (Math.random() - 0.5) * 120, 0],
            scale: [1, Math.random() + 0.8, 1],
            rotate: [0, Math.random() * 180, 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: Math.random() * 15 + 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
        />
      ))}
    </>
  );
};

// New Component: Animated Stats Counter
const AnimatedCounter: React.FC<{ end: number; duration?: number; label: string }> = ({
  end,
  duration = 2,
  label
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 'some' });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(start));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [inView, end, duration]);

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-black text-brand-primary mb-2"
      >
        {count}+
      </motion.div>
      <div className="text-slate-600 font-medium">{label}</div>
    </div>
  );
};

// New Component: Interactive Feature Card
const InteractiveFeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}> = ({ icon: Icon, title, description, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.5, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-brand-primary/30 hover:shadow-xl transition-all cursor-pointer group"
    >
      <motion.div
        animate={{
          scale: isHovered ? 1.1 : 1,
          rotate: isHovered ? 5 : 0
        }}
        transition={{ duration: 0.3 }}
        className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/20 transition-colors"
      >
        <Icon className="h-7 w-7 text-brand-primary" />
      </motion.div>

      <h3 className="text-xl font-bold mb-3 group-hover:text-brand-primary transition-colors">
        {title}
      </h3>

      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>

      {/* Animated underline on hover */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="h-0.5 bg-brand-primary mt-4 origin-left"
      />
    </motion.div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onSelectTier, onPlanSelection }) => {
  const [marketVibe, setMarketVibe] = useState<'bull' | 'bear'>('bull');
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const controls = useAnimation();
  const mainRef = useRef<HTMLDivElement>(null);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const plans = await socialMediaService.getSubscriptionPlans();
        setSubscriptionPlans(plans ?? []);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setSubscriptionPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Enhanced interval for market vibe toggle with smoother timing
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketVibe(prev => prev === 'bull' ? 'bear' : 'bull');
      controls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.8, ease: 'easeInOut' }
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [controls]);

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
        ease: "easeOut"
      }
    }
  };

  const childVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden relative font-sans" ref={mainRef}>
        {/* Enhanced floating particles with dynamic movement */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <FloatingParticles />
        </div>

        {/* Animated background grid */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Enhanced Navbar with blur and scale animation */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
        >
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
            >
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-brand-primary" />
              </motion.div>
              <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-brand-primary bg-clip-text text-transparent">
                {APP_DISPLAY_NAMES.short}<span className="text-brand-primary">{APP_DISPLAY_NAMES.full.split(' ')[1]}</span>
              </span>
            </motion.div>

            <div className="flex items-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  backgroundColor: '#1e293b'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectTier('login')}
                className="bg-slate-800 border border-slate-700 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              >
                Login <ArrowRight className="inline h-4 w-4 ml-1" />
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {/* Enhanced Hero Section with parallax effects */}
        <header className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
          {/* Animated background elements */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/80 to-cyan-50/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          />

          <motion.div animate={controls} className="container mx-auto px-4 sm:px-6 text-center relative z-10">
            {/* Enhanced badge with floating animation */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-brand-primary/15 to-cyan-500/15 border border-brand-primary/30 px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-6 sm:mb-8 shadow-lg backdrop-blur-sm relative overflow-hidden"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-brand-primary" />
              </motion.div>
              <span className="font-bold text-brand-primary tracking-wider text-xs sm:text-sm md:text-base bg-gradient-to-r from-brand-primary to-cyan-500 bg-clip-text text-transparent">
                WELCOME TO NEXT-GEN TRADING
              </span>
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '100%', opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </motion.div>

            {/* Enhanced main headline with staggered text animation */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 leading-tight tracking-tight px-2"
              >
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="block"
                >
                  TRADE SMARTER
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="block"
                >
                  <span className="text-red-500 line-through decoration-4 decoration-slate-300">GUESS</span>
                  <span className="text-brand-primary ml-4">WIN</span>
                </motion.span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-8 sm:mb-12 max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto leading-relaxed"
            >
              <span className="text-brand-primary font-bold">AI-powered signals, institutional risk management,</span> and mentorship that transforms retail traders into consistent performers.
            </motion.p>

            {/* Enhanced Market Visualization Container */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="relative h-52 sm:h-72 mb-10 sm:mb-16 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl sm:rounded-3xl overflow-hidden max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto shadow-2xl hover:shadow-2xl transition-all"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={marketVibe}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <MarketVibeVisualization vibe={marketVibe} />
                </motion.div>
              </AnimatePresence>
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-slate-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200/60">
                Live Market Vibe • Powered by Advanced AI
              </div>
            </motion.div>

            {/* Enhanced CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectTier('signup')}
                className="group relative px-8 sm:px-12 py-4 sm:py-5 bg-slate-900 text-white font-black text-lg sm:text-xl rounded-2xl overflow-hidden shadow-2xl w-full sm:w-auto max-w-sm"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Start Trading Smarter
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Rocket className="h-5 w-5" />
                  </motion.div>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
            </motion.div>
          </motion.div>
        </header>

        {/* New Stats Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
          className="py-16 sm:py-24 bg-slate-50/50"
        >
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div variants={childVariants} className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
                Trusted by <span className="text-brand-primary">Thousands</span> of Traders
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Join a community of successful traders who transformed their results with our proven methodology
              </p>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              <AnimatedCounter end={2500} label="Active Traders" />
              <AnimatedCounter end={89} label="Success Rate" />
              <AnimatedCounter end={15} label="Average ROI" />
              <AnimatedCounter end={24} label="Support Hours" />
            </motion.div>
          </div>
        </motion.section>

        {/* Enhanced Features Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-16 sm:py-24 bg-white"
        >
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div variants={childVariants} className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
                Why <span className="text-brand-primary">{APP_DISPLAY_NAMES.short}</span> Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                We combine cutting-edge technology with proven trading principles to give you an unfair advantage
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
              <InteractiveFeatureCard
                icon={Target}
                title="Precision Signals"
                description="AI-powered trade setups with exact entry, stop loss, and take profit levels based on institutional order flow."
                delay={0.1}
              />
              <InteractiveFeatureCard
                icon={Shield}
                title="Risk Management"
                description="Built-in risk controls and position sizing calculators to protect your capital and maximize returns."
                delay={0.2}
              />
              <InteractiveFeatureCard
                icon={Users}
                title="Live Community"
                description="Join thousands of traders in real-time discussions, mentorship sessions, and market analysis."
                delay={0.3}
              />
              <InteractiveFeatureCard
                icon={BarChart2}
                title="Market Analytics"
                description="Advanced market structure analysis, liquidity detection, and smart money concepts explained simply."
                delay={0.4}
              />
              <InteractiveFeatureCard
                icon={Clock}
                title="24/7 Monitoring"
                description="Our systems monitor global markets around the clock, alerting you to high-probability setups instantly."
                delay={0.5}
              />
              <InteractiveFeatureCard
                icon={Award}
                title="Proven Results"
                description="Join the 89% of our members who report improved consistency and profitability within 30 days."
                delay={0.6}
              />
            </div>
          </div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="py-16 sm:py-24 bg-white"
        >
          <div className="container mx-auto px-4 sm:px-6">
            {subscriptionPlans.length > 0 && (
              <motion.div variants={childVariants} className="text-center mb-12 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">Choose Your Track</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Select the plan that matches your trading goals and experience level
                </p>
              </motion.div>
            )}

            {loadingPlans ? (
              <div className="flex justify-center items-center h-64">
                <motion.div
                  className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                  style={{ borderColor: 'var(--brand-primary)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : subscriptionPlans.length > 0 ? (
              <motion.div
                className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto overflow-x-auto pb-8 md:pb-0 no-scrollbar snap-x touch-pan-x"
                variants={sectionVariants}
              >
                {subscriptionPlans.map((plan, index) => {
                  const isPopular = plan.name === 'Professional';
                  const isElite = plan.name === 'Elite Mentorship';
                  const isFree = plan.name === 'Free Plan';
                  return (
                    <motion.div
                      key={plan.id}
                      variants={childVariants}
                      custom={index}
                      className={`bg-white border rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col w-[280px] md:w-auto flex-shrink-0 snap-center ${isPopular ? 'border-2 border-blue-600 relative shadow-xl scale-[1.02] md:scale-105 my-2 md:my-0' : 'border border-slate-200'} shadow-card card-hover transition-all`}
                      whileHover={{ y: -5 }}
                    >
                      {isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white font-bold px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm shadow-sm">MOST POPULAR</div>}

                      <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isElite ? 'text-purple-600' : isFree ? 'text-slate-500' : 'text-slate-900'}`}>{plan.name}</h3>

                      <div className={`text-3xl sm:text-4xl font-black mb-4 sm:mb-6 ${isPopular ? 'text-blue-600' : isElite ? 'text-purple-600' : 'text-slate-900'}`}>
                        ${plan.price}
                      </div>

                      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className={`flex gap-2 sm:gap-3 text-sm ${isPopular || (isElite && idx === 0) ? 'text-slate-900' : 'text-slate-600'}`}>
                            <Check className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${isElite ? 'text-purple-600' : 'text-blue-600'}`} />
                            <span className={isPopular || (isElite && idx === 0) ? 'font-semibold' : ''}>{feature}</span>
                          </li>
                        ))}
                        {isElite && (
                          <li className="flex gap-2 sm:gap-3 text-purple-600 font-bold text-sm">
                            <Bot className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                            <span>Alpha-V5 MQL5 Bot Included</span>
                          </li>
                        )}
                      </ul>

                      <motion.button
                        onClick={() => {
                          if (onPlanSelection && plan.name) {
                            onPlanSelection(plan.name);
                          } else {
                            onSelectTier('signup');
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        className={`w-full py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-bold transition text-sm sm:text-base ${isPopular ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-glow' : isElite ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm' : 'border border-slate-200 hover:bg-slate-50 text-slate-800'}`}
                      >
                        {isFree ? 'Join for Free' : isElite ? 'Apply Now' : 'Get Started'}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">No plans available at the moment.</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Why Traders Lose Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="py-16 sm:py-24 bg-white border-t border-slate-100"
        >
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div variants={childVariants} className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4">Why Traders Often <span className="text-red-500">Lose</span></h2>
              <p className="text-lg text-slate-600">Many follow signals blindly. We teach <span className="text-slate-900 font-bold">institutional thinking</span> and repeatable process.</p>
            </motion.div>

            <motion.div variants={sectionVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                { icon: AlertTriangle, title: "Retail Logic", desc: "Chasing indicator noise while liquidity does the heavy lifting.", color: "text-red-500" },
                { icon: Shield, title: "Institutional Logic", desc: "We align with institutional flows: liquidity, structure, and order blocks.", color: "text-blue-600" },
                { icon: TrendingUp, title: "Precision R:R", desc: "Strict risk management (min 1:3) enforced by our AI guard.", color: "text-emerald-600" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={childVariants}
                  className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 shadow-card card-hover transition"
                  whileHover={{ y: -6 }}
                >
                  <item.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${item.color} mb-4 sm:mb-5`} />
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* AI Feature Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="py-16 sm:py-24 relative overflow-hidden bg-[#F5F7FA]"
        >
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
              <motion.div variants={childVariants} className="lg:w-1/2">
                <div className="inline-block bg-blue-50 text-blue-700 border border-blue-200 font-bold px-3.5 py-1 rounded-full mb-4 sm:mb-6 text-xs uppercase tracking-wider">EXCLUSIVE TECHNOLOGY</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4 sm:mb-6 leading-tight">The Program With An <span className="text-blue-600">AI That Says "NO"</span></h2>
                <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8">
                  Paste your setup → AI runs a proven checklist.
                  <br /><br />
                  <span className="text-emerald-600 font-bold">✅ Green Light:</span> High probability trade.<br />
                  <span className="text-red-500 font-bold">❌ Red Light:</span> Stop and reassess.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => onSelectTier('signup')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition flex items-center gap-2 shadow-blue-glow"
                >
                  Try AI Trade Guard <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
              </motion.div>

              <motion.div
                variants={childVariants}
                className="lg:w-1/2"
                initial={{ rotate: 1 }}
                whileHover={{ rotate: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-4">
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 rounded-full animate-pulse-dot" />
                    <div className="font-bold text-sm sm:text-base text-slate-900">AI Analysis: EURUSD Buy Setup</div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-start gap-2 sm:gap-3 text-emerald-700 font-semibold"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" /> <span className="text-sm sm:text-base">Liquidity grabbed from PD Low</span></motion.div>
                    <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-start gap-2 sm:gap-3 text-emerald-700 font-semibold"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" /> <span className="text-sm sm:text-base">Unmitigated FVG Identified</span></motion.div>
                    <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-start gap-2 sm:gap-3 text-emerald-700 font-semibold"><CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" /> <span className="text-sm sm:text-base">Market Structure Shift (MSS) confirmed</span></motion.div>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-lg mt-3 sm:mt-4">
                      <p className="font-bold text-emerald-700 mb-1 text-sm sm:text-base">✅ TRADE APPROVED</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">All confluence factors met. Risk 1% and set TP at 1.0950.</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Enhanced CTA Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-center relative overflow-hidden"
        >
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white"
            >
              Ready to Transform Your Trading?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto font-medium"
            >
              Join thousands of successful traders today. Limited spots available.
            </motion.p>

            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut'
              }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectTier('signup')}
                className="px-8 sm:px-12 py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl shadow-blue-glow transition-all"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Start Your Journey
                  <Sparkles className="h-5 w-5" />
                </span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 text-slate-400 text-xs font-medium"
            >
              {APP_MESSAGES.copyright}
            </motion.div>
          </div>
        </motion.section>
      </div>

      <style>{`
        :root {
          --brand-primary: #3B82F6;
          --brand-accent: #1D4ED8;
        }
        .text-brand-primary { color: #3B82F6; }
        .bg-brand-primary { background-color: #3B82F6; }
        
        html {
          scroll-behavior: smooth;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #F5F7FA;
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default LandingPage;
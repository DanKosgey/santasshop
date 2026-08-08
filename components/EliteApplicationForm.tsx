import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MentorshipApplication } from '../types';
import { CheckCircle, ArrowLeft, Send, AlertCircle, ShieldCheck, Wallet, TrendingUp, Brain, User, Mail, Hash, DollarSign, Award, Target, Clock } from 'lucide-react';

// Extend the existing interface
interface ExtendedMentorshipApplication extends MentorshipApplication {
  subscriptionTier?: string;
}

interface EliteApplicationFormProps {
  selectedPlan?: string | null;
  onSubmit: (data: ExtendedMentorshipApplication) => void;
  onCancel: () => void;
}

const EliteApplicationForm: React.FC<EliteApplicationFormProps> = ({ selectedPlan, onSubmit, onCancel }) => {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExtendedMentorshipApplication>({
    fullName: '',
    email: '',
    discordId: '',
    experienceYears: '0-1',
    currentCapital: '',
    biggestStruggle: 'Strategy & Edge',
    motivation: '',
    commitmentAgreement: false,
    subscriptionTier: selectedPlan || 'free'
  });

  // Set the biggestStruggle to the first option if it's still the old default
  useEffect(() => {
    if (formData.biggestStruggle === 'Strategy') {
      setFormData(prev => ({
        ...prev,
        biggestStruggle: 'Strategy & Edge'
      }));
    }
  }, []);

  // Pre-select the plan if provided
  useEffect(() => {
    if (selectedPlan) {
      // We could store this in state or pass it to the backend
      console.log('Selected plan:', selectedPlan);
    }
  }, [selectedPlan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, commitmentAgreement: e.target.checked }));
  };

  // Add this new function for handling tier changes
  const handleTierChange = (tier: string) => {
    setFormData(prev => ({ ...prev, subscriptionTier: tier }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setStep('confirm');
  };

  const handleFinalize = () => {
    onSubmit(formData);
  };

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-trade-neon/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-gradient-to-br from-gray-900 to-black border border-trade-neon rounded-2xl md:rounded-3xl p-6 md:p-12 text-center relative z-10 shadow-[0_0_50px_rgba(0,255,148,0.15)]"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-trade-neon/30 to-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <CheckCircle className="h-12 w-12 text-trade-neon" />
          </div>

          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-trade-neon to-purple-400 bg-clip-text text-transparent">
            Application Received!
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Your application for the <span className="text-purple-400 font-bold">Elite Mentorship</span> has been securely submitted.
          </p>

          {selectedPlan && (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-4 text-left mb-6 border border-gray-800 backdrop-blur-sm">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-lg">
                <Wallet className="text-trade-neon h-5 w-5" /> Selected Plan:
              </h3>
              <p className="text-lg text-trade-neon font-bold">{selectedPlan}</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-6 text-left mb-8 border border-gray-800 backdrop-blur-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
              <ShieldCheck className="text-trade-neon h-6 w-6" /> Next Steps:
            </h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex gap-3 items-start">
                <span className="bg-gradient-to-br from-trade-neon to-purple-600 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</span>
                <span className="text-lg">Alex and the team will review your trading history and goals within 48 hours.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-gradient-to-br from-trade-neon to-purple-600 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</span>
                <span className="text-lg">If approved, you will receive an invitation email with a payment link and Discord access.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-gradient-to-br from-trade-neon to-purple-600 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</span>
                <span className="text-lg">In the meantime, we've unlocked the <span className="text-white font-bold">Starter Dashboard</span> for you to begin reviewing the basics.</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleFinalize}
            className="w-full bg-gradient-to-r from-trade-neon to-green-400 text-black font-black text-xl py-5 rounded-xl hover:from-green-400 hover:to-trade-neon transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-trade-neon/30 hover:shadow-trade-neon/50 transform hover:scale-[1.02]"
          >
            Access Starter Dashboard <ArrowLeft className="h-6 w-6 rotate-180" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-12 px-4 md:px-8 font-sans">
      {/* Animated Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/50"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-trade-neon/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-400 hover:text-trade-neon mb-8 transition-all duration-300 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Back to Options
        </button>

        <div className="text-center mb-12">
          {selectedPlan && (
            <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-4 py-2 rounded-full mb-4 text-sm">
              Applying for: {selectedPlan}
            </div>
          )}
          <p className="text-2xl text-purple-400 font-bold mb-2">Limited Spots Available</p>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Join the ranks of traders who've scaled to 6-figures with our proven methodology
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 shadow-xl"
            >
              <h3 className="font-bold mb-4 text-lg text-gray-200 flex items-center gap-2">
                <ShieldCheck className="text-trade-neon h-5 w-5" /> Requirements
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-300 group hover:text-trade-neon transition-colors">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-trade-neon/20 transition-colors">
                    <Wallet className="h-5 w-5 text-trade-neon" />
                  </div>
                  <div>
                    <p className="font-bold">Lowest Deposit</p>
                    <p className="text-sm">Start copy trading with just $50 minimum deposit</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-300 group hover:text-trade-neon transition-colors">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-trade-neon/20 transition-colors">
                    <TrendingUp className="h-5 w-5 text-trade-neon" />
                  </div>
                  <div>
                    <p className="font-bold">Execution Discipline</p>
                    <p className="text-sm">Commitment to execute only A+ setups</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-gray-300 group hover:text-trade-neon transition-colors">
                  <div className="bg-gray-800 p-2 rounded-lg group-hover:bg-trade-neon/20 transition-colors">
                    <Brain className="h-5 w-5 text-trade-neon" />
                  </div>
                  <div>
                    <p className="font-bold">Mindset Transformation</p>
                    <p className="text-sm">Willingness to unlearn "retail" bad habits</p>
                  </div>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl backdrop-blur-sm"
            >
              <div className="flex gap-3 items-start">
                <AlertCircle className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-purple-200 mb-2">Our Commitment</h3>
                  <p className="text-purple-100">
                    We only accept students we believe we can help scale to 6-figures. This application helps us ensure you're a good fit for our elite program.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Add subscription tier selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-800 shadow-xl"
            >
              <h3 className="font-bold mb-4 text-lg text-gray-200 flex items-center gap-2">
                <Wallet className="text-trade-neon h-5 w-5" /> Select Your Plan
              </h3>
              <div className="space-y-3">
                {[
                  { value: 'free', label: 'Free Community Access', price: '$0', description: 'Basic access to our community platform' },
                  { value: 'foundation', label: 'Foundation Course', price: '$47', description: 'Core course modules and community access' },
                  { value: 'professional', label: 'Professional Program', price: '$97', description: 'Full course access with AI Trade Guard' },
                  { value: 'elite', label: 'Elite Mentorship', price: '$297', description: 'Premium mentorship with personalized support' }
                ].map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => handleTierChange(tier.value)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${formData.subscriptionTier === tier.value
                        ? 'bg-gradient-to-r from-trade-neon/20 to-purple-600/20 border-2 border-trade-neon shadow-lg shadow-trade-neon/20'
                        : 'bg-gray-800/50 border border-gray-700 hover:border-trade-neon hover:bg-gray-800/80'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{tier.label}</div>
                        <div className="text-sm text-gray-400">{tier.description}</div>
                      </div>
                      <div className={`font-bold ${formData.subscriptionTier === tier.value ? 'text-trade-neon' : 'text-gray-300'}`}>
                        {tier.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 shadow-2xl"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
                      <User className="h-4 w-4 text-trade-neon" /> Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-trade-neon focus:ring-2 focus:ring-trade-neon/30 outline-none transition-all duration-300 placeholder-gray-600"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
                      <Mail className="h-4 w-4 text-trade-neon" /> Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-trade-neon focus:ring-2 focus:ring-trade-neon/30 outline-none transition-all duration-300 placeholder-gray-600"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
                    <DollarSign className="h-4 w-4 text-trade-neon" /> Current Capital ($)
                  </label>
                  <input
                    type="text"
                    name="currentCapital"
                    required
                    className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-trade-neon focus:ring-2 focus:ring-trade-neon/30 outline-none transition-all duration-300 placeholder-gray-600"
                    placeholder="e.g. 10,000 or 100k Funded"
                    value={formData.currentCapital}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
                      <Award className="h-4 w-4 text-trade-neon" /> Experience Level
                    </label>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: '0-1', label: 'New (0-1 Years)' },
                        { value: '1-3', label: 'Intermediate (1-3 Years)' },
                        { value: '3+', label: 'Advanced (3+ Years)' }
                      ].map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, experienceYears: level.value }))}
                          className={`py-4 px-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${formData.experienceYears === level.value
                              ? 'bg-gradient-to-r from-trade-neon to-green-400 text-black shadow-lg shadow-trade-neon/30'
                              : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-300 hover:border-trade-neon hover:text-white hover:shadow-trade-neon/20'
                            }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
                      <Target className="h-4 w-4 text-trade-neon" /> Biggest Struggle
                    </label>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                      {[
                        { value: 'Strategy & Edge', label: 'Strategy & Edge' },
                        { value: 'Psychology (FOMO/Revenge)', label: 'Psychology (FOMO/Revenge)' },
                        { value: 'Risk Management', label: 'Risk Management' },
                        { value: 'Discipline & Consistency', label: 'Discipline & Consistency' }
                      ].map((struggle) => (
                        <button
                          key={struggle.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, biggestStruggle: struggle.value }))}
                          className={`py-4 px-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${formData.biggestStruggle === struggle.value
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                              : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-300 hover:border-purple-500 hover:text-white hover:shadow-purple-500/20'
                            }`}
                        >
                          {struggle.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
                    <Target className="h-4 w-4 text-trade-neon" /> Why do you want to join the Elite Mentorship?
                  </label>
                  <textarea
                    name="motivation"
                    required
                    rows={4}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white focus:border-trade-neon focus:ring-2 focus:ring-trade-neon/30 outline-none transition-all duration-300 resize-none placeholder-gray-600"
                    placeholder="Tell us about your goals and why you're ready to commit to becoming a professional trader..."
                    value={formData.motivation}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-start gap-4 bg-gray-900/30 p-5 rounded-xl border border-gray-800 hover:border-trade-neon/50 transition-all duration-300">
                  <input
                    type="checkbox"
                    id="agreement"
                    required
                    className="mt-1 w-5 h-5 accent-trade-neon"
                    checked={formData.commitmentAgreement}
                    onChange={handleCheckboxChange}
                  />
                  <label htmlFor="agreement" className="text-gray-300 cursor-pointer group">
                    <span className="font-bold text-white group-hover:text-trade-neon transition-colors">Commitment Agreement:</span> I understand that the Elite Mentorship requires roughly 5-10 hours per week of study and live chart time. I am ready to do the work and fully commit to the program.
                  </label>
                </div>

                {/* Add hidden input to store subscription tier */}
                <input type="hidden" name="subscriptionTier" value={formData.subscriptionTier} />

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.commitmentAgreement}
                  className={`w-full py-5 rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 ${isSubmitting || !formData.commitmentAgreement
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 transform hover:scale-[1.02]'
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      Processing Application...
                    </span>
                  ) : (
                    <>
                      Submit Application <Send className="h-6 w-6" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EliteApplicationForm;
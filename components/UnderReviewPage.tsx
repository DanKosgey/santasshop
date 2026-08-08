import React from 'react';
import { Clock, Users, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';

interface UnderReviewPageProps {
  userTier?: string | null;
  onLogout: () => void;
}

const UnderReviewPage: React.FC<UnderReviewPageProps> = ({ userTier, onLogout }) => {
  const isFreeTier = userTier === 'free' || userTier === 'foundation';
  
  const handleLogout = () => {
    try {
      onLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Redirect to landing page even if there's an error
      window.location.hash = '/';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-trade-neon/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-2xl w-full bg-gradient-to-br from-gray-900 to-black border border-trade-neon rounded-3xl p-8 md:p-12 text-center relative z-10 shadow-[0_0_50px_rgba(0,255,148,0.15)]">
        <div className="w-24 h-24 bg-gradient-to-br from-trade-neon/30 to-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Clock className="h-12 w-12 text-trade-neon" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-trade-neon to-purple-400 bg-clip-text text-transparent">
          {isFreeTier ? 'Application Under Review' : 'Account Under Review'}
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          {isFreeTier 
            ? 'Your application for community access is being reviewed by our team.' 
            : 'Your account is currently under review by our team.'}
        </p>
        
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-6 text-left mb-8 border border-gray-800 backdrop-blur-sm">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
            <AlertCircle className="text-trade-neon h-6 w-6" /> What happens next:
          </h3>
          <ul className="space-y-4 text-gray-300">
            <li className="flex gap-3 items-start">
              <span className="bg-gradient-to-br from-trade-neon to-purple-600 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</span>
              <span className="text-lg">Our team will review your application within 24-48 hours.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="bg-gradient-to-br from-trade-neon to-purple-600 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</span>
              <span className="text-lg">You'll receive an email notification with the decision.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="bg-gradient-to-br from-trade-neon to-purple-600 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</span>
              <span className="text-lg">While you wait, you have access to our community platform.</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-xl p-6 text-left mb-8 border border-gray-800 backdrop-blur-sm">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
            <Users className="text-trade-neon h-6 w-6" /> Community Access:
          </h3>
          <p className="text-gray-300 mb-4 text-lg">
            As a new member, you have access to our community platform while your application is being reviewed:
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-trade-neon flex-shrink-0" />
              <span>Join our Discord and Telegram groups</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-trade-neon flex-shrink-0" />
              <span>Participate in community discussions</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-trade-neon flex-shrink-0" />
              <span>Access basic market updates and signals</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => window.location.hash = '/community'}
            className="flex-1 bg-gradient-to-r from-trade-neon to-green-400 text-black font-black text-xl py-5 rounded-xl hover:from-green-400 hover:to-trade-neon transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-trade-neon/30 hover:shadow-trade-neon/50 transform hover:scale-[1.02]"
          >
            Access Community <Users className="h-6 w-6" />
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white font-black text-xl py-5 rounded-xl hover:from-gray-600 hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-gray-900/30 hover:shadow-gray-900/50 transform hover:scale-[1.02] border border-gray-700"
          >
            Logout <MessageCircle className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnderReviewPage;
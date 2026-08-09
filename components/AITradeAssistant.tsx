import React, { useState, useRef, useEffect } from 'react';
import { validateTradeWithGemini } from '../services/geminiService';
import { Send, Upload, AlertTriangle, CheckCircle, XCircle, Loader2, BookOpen, Image as ImageIcon, TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import { ChatMessage, TradeRule, TradeEntry, TradeValidationStatus } from '../types';
import { fetchUserRules } from '../services/adminService';
import { supabase } from '../supabase/client';

interface AITradeAssistantProps {
  userId: string;
  onLogTrade: (entry: Partial<TradeEntry>) => void;
}

const AITradeAssistant: React.FC<AITradeAssistantProps> = ({ userId, onLogTrade }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your AI Risk Manager. Tell me about the trade you want to take. Is it a Buy or Sell?', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userRules, setUserRules] = useState<TradeRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [conversationStep, setConversationStep] = useState<'initial' | 'awaiting_direction' | 'awaiting_details' | 'analysis_complete'>('initial');
  const [tradeContext, setTradeContext] = useState<{ direction?: 'buy' | 'sell'; pair?: string; details?: string }>({});

  const [lastAnalyzedTrade, setLastAnalyzedTrade] = useState<Partial<TradeEntry> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderMessageContent = (msg: ChatMessage) => {
    try {
      const parsed = JSON.parse(msg.text);
      if (parsed.verdict && parsed.explanation) {
        return (
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${parsed.verdict === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              parsed.verdict === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
              {parsed.verdict === 'APPROVED' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Trade Approved
                </>
              ) : parsed.verdict === 'REJECTED' ? (
                <>
                  <XCircle className="h-4 w-4" />
                  Trade Rejected
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Trade Warning
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap break-words leading-relaxed text-slate-700 text-sm overflow-x-auto">
              {parsed.explanation}
            </div>
          </div>
        );
      }
    } catch (e) {
      // Not JSON
    }

    return <div className="whitespace-pre-wrap break-words leading-relaxed text-slate-700 text-sm overflow-x-auto">{msg.text}</div>;
  };

  useEffect(() => {
    loadUserRules();

    const channel = supabase
      .channel('user-rule-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_rules',
        },
        () => {
          loadUserRules();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trade_rules',
        },
        () => {
          loadUserRules();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trade_rules',
        },
        () => {
          loadUserRules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadUserRules = async () => {
    try {
      setLoadingRules(true);
      const rulesData = await fetchUserRules(userId);
      const formattedRules = rulesData.map((rule: any) => ({
        id: rule.id,
        text: rule.text,
        type: rule.type,
        required: rule.required
      }));
      setUserRules(formattedRules);
    } catch (error) {
      console.error('Error loading user rules:', error);
    } finally {
      setLoadingRules(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');

    switch (conversationStep) {
      case 'initial':
        const lowerInput = currentInput.toLowerCase();
        if (lowerInput.includes('buy') || lowerInput.includes('long')) {
          setTradeContext({ direction: 'buy' });
          setConversationStep('awaiting_direction');
          const aiMsg: ChatMessage = {
            role: 'model',
            text: "Great! You want to take a Buy position. What currency pair or asset are you looking at? (e.g., EURUSD, XAUUSD, BTCUSD)",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
        } else if (lowerInput.includes('sell') || lowerInput.includes('short')) {
          setTradeContext({ direction: 'sell' });
          setConversationStep('awaiting_direction');
          const aiMsg: ChatMessage = {
            role: 'model',
            text: "Great! You want to take a Sell position. What currency pair or asset are you looking at? (e.g., EURUSD, XAUUSD, BTCUSD)",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          const aiMsg: ChatMessage = {
            role: 'model',
            text: "I didn't catch that. Are you looking to take a Buy or Sell position?",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
        }
        return;

      case 'awaiting_direction':
        setTradeContext(prev => ({ ...prev, pair: currentInput.trim() }));
        setConversationStep('awaiting_details');
        const pairMsg: ChatMessage = {
          role: 'model',
          text: `Thanks! I see you're looking at ${currentInput.trim()}. Now, please describe your trade setup. Include details like:\n- Entry point\n- Stop loss level\n- Take profit level\n- Why you're taking this trade\n- Any chart patterns or indicators you're using\n\nYou can also upload a screenshot of your chart for visual analysis.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, pairMsg]);
        return;

      case 'awaiting_details':
        setTradeContext(prev => ({ ...prev, details: currentInput.trim() }));
        setConversationStep('analysis_complete');
        break;

      default:
        break;
    }

    setIsAnalyzing(true);
    setLastAnalyzedTrade(null);

    const activeRules = userRules.map(r => r.text);

    const tradeDetails = `
Trade Direction: ${tradeContext.direction || 'Not specified'}
Asset/Pair: ${tradeContext.pair || 'Not specified'}
User Details: ${tradeContext.details || currentInput}
    `;

    const aiResponse = await validateTradeWithGemini(
      tradeDetails,
      activeRules,
      selectedImage || undefined
    );

    let aiResponseText = '';
    if (typeof aiResponse === 'string') {
      aiResponseText = aiResponse;
    } else if (typeof aiResponse === 'object' && aiResponse !== null) {
      if ('explanation' in aiResponse && 'verdict' in aiResponse) {
        aiResponseText = JSON.stringify({
          verdict: aiResponse.verdict,
          explanation: aiResponse.explanation
        });
      } else {
        aiResponseText = JSON.stringify(aiResponse, null, 2);
      }
    } else {
      aiResponseText = String(aiResponse);
    }

    const aiMsg: ChatMessage = {
      role: 'model',
      text: aiResponseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsAnalyzing(false);

    const lowerResponse = aiResponseText.toLowerCase();
    const validationResult: TradeValidationStatus =
      lowerResponse.includes('approved') ? 'approved' :
        lowerResponse.includes('rejected') ? 'rejected' :
          'warning';

    const type = tradeContext.direction || (currentInput.toLowerCase().includes('sell') ? 'sell' : 'buy');

    setLastAnalyzedTrade({
      notes: `AI Analysis Request: ${tradeDetails}`,
      validationResult: validationResult,
      type: type,
      screenshotUrl: selectedImage || undefined,
      date: new Date().toISOString()
    });

    setSelectedImage(null);
  };

  const renderImagePreview = () => {
    if (!selectedImage) return null;

    return (
      <div className="mb-4 relative group">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-700">Chart Analysis</span>
          </div>
          <div className="relative">
            <img
              src={selectedImage}
              alt="Trade chart"
              className="w-full h-32 object-contain rounded-lg border border-slate-200 bg-white"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent rounded-lg flex items-end p-2">
              <span className="text-xs text-white font-medium">AI will analyze this chart</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedImage(null)}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition shadow-sm"
        >
          <XCircle className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  };

  const renderProgressIndicator = () => {
    return (
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'initial' || conversationStep === 'awaiting_direction' || conversationStep === 'awaiting_details' || conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
        <div className={`h-1 w-8 ${conversationStep === 'awaiting_direction' || conversationStep === 'awaiting_details' || conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'awaiting_direction' || conversationStep === 'awaiting_details' || conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
        <div className={`h-1 w-8 ${conversationStep === 'awaiting_details' || conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'awaiting_details' || conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
        <div className={`h-1 w-8 ${conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'analysis_complete' ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card font-sans">
      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-200 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse-dot"></div>
            <h2 className="font-bold text-xl text-slate-900">AI Trade Validator</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Powered by</span>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Gemini 2.5 Flash
            </span>
          </div>
        </div>
        {renderProgressIndicator()}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#F5F7FA]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white text-slate-700 rounded-tl-none border border-slate-200'
              }`}>
              {msg.role === 'user' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">U</span>
                  </div>
                  <span className="text-xs font-medium opacity-90">You</span>
                </div>
              )}

              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">AI</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">AI Risk Manager</span>
                </div>
              )}

              {renderMessageContent(msg)}

              <div className={`text-[10px] mt-2.5 text-right font-medium ${msg.role === 'user' ? 'opacity-80' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm max-w-[85%]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">AI</span>
                </div>
                <span className="text-xs font-bold text-slate-800">AI Risk Manager</span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Analyzing your trade setup...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {renderImagePreview()}

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition border border-slate-200"
            title="Upload Chart Screenshot"
          >
            <Upload className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                conversationStep === 'initial' ? "Is it a Buy or Sell?" :
                  conversationStep === 'awaiting_direction' ? "Which asset? (e.g., EURUSD, XAUUSD)" :
                    conversationStep === 'awaiting_details' ? "Describe your setup..." :
                      "Continue the conversation..."
              }
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              disabled={isAnalyzing || loadingRules}
            />
            {conversationStep === 'awaiting_details' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={isAnalyzing || (!inputText && !selectedImage) || loadingRules}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shadow-sm"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-500 text-center flex flex-wrap justify-center gap-2 font-medium">
          {loadingRules ? (
            <span>Loading your rules...</span>
          ) : (
            <>
              <span>Using <span className="text-amber-600 font-bold">{userRules.length} rules</span> for validation.</span>
              {conversationStep === 'awaiting_details' && (
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Attach screenshots for better analysis!
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITradeAssistant;
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

  // State to track the context of the last trade discussed
  const [lastAnalyzedTrade, setLastAnalyzedTrade] = useState<Partial<TradeEntry> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to render message content with special formatting for AI responses
  const renderMessageContent = (msg: ChatMessage) => {
    // Try to parse the message as JSON to see if it's a structured response
    try {
      const parsed = JSON.parse(msg.text);
      if (parsed.verdict && parsed.explanation) {
        // It's a structured response, render it with special formatting
        return (
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${parsed.verdict === 'APPROVED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              parsed.verdict === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
              {parsed.verdict === 'APPROVED' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Trade Approved
                </>
              ) : parsed.verdict === 'REJECTED' ? (
                <>
                  <XCircle className="h-5 w-5" />
                  Trade Rejected
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  Trade Warning
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-200 overflow-x-auto">
              {parsed.explanation}
            </div>
          </div>
        );
      }
    } catch (e) {
      // Not JSON, render as plain text
    }

    // Render as plain text
    return <div className="whitespace-pre-wrap break-words leading-relaxed text-gray-200 overflow-x-auto">{msg.text}</div>;
  };

  // Load user rules on component mount
  useEffect(() => {
    loadUserRules();

    // Set up real-time subscription for rule changes
    const channel = supabase
      .channel('user-rule-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_rules',
        },
        (payload) => {
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
        (payload) => {
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
        (payload) => {
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

    // Handle conversation flow
    switch (conversationStep) {
      case 'initial':
        // Determine if user mentioned buy or sell
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
          // Ask again for clarity
          const aiMsg: ChatMessage = {
            role: 'model',
            text: "I didn't catch that. Are you looking to take a Buy or Sell position?",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
        }
        return;

      case 'awaiting_direction':
        // Capture the pair
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
        // Capture the details and proceed to analysis
        setTradeContext(prev => ({ ...prev, details: currentInput.trim() }));
        setConversationStep('analysis_complete');
        // Proceed to analysis
        break;

      default:
        // For subsequent messages, just add to context
        break;
    }

    setIsAnalyzing(true);
    setLastAnalyzedTrade(null); // Reset previous analysis context

    // Prepare rules text
    const activeRules = userRules.map(r => r.text);

    // Prepare comprehensive trade details for analysis
    const tradeDetails = `
Trade Direction: ${tradeContext.direction || 'Not specified'}
Asset/Pair: ${tradeContext.pair || 'Not specified'}
User Details: ${tradeContext.details || currentInput}
    `;

    // Call Gemini with image if available
    const aiResponse = await validateTradeWithGemini(
      tradeDetails,
      activeRules,
      selectedImage || undefined
    );

    // Handle the response properly - store as JSON string so it can be parsed by renderMessageContent
    let aiResponseText = '';
    if (typeof aiResponse === 'string') {
      aiResponseText = aiResponse;
    } else if (typeof aiResponse === 'object' && aiResponse !== null) {
      if ('explanation' in aiResponse && 'verdict' in aiResponse) {
        // It's already in the correct format, stringify it so renderMessageContent can parse it
        aiResponseText = JSON.stringify({
          verdict: aiResponse.verdict,
          explanation: aiResponse.explanation
        });
      } else {
        // Convert object to string
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

    // Heuristic parsing to create a draft trade entry
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

    setSelectedImage(null); // Clear image after send
  };

  // Render a preview of the uploaded image
  const renderImagePreview = () => {
    if (!selectedImage) return null;

    return (
      <div className="mb-4 relative group">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-trade-neon" />
            <span className="text-xs font-medium text-gray-300">Chart Analysis</span>
          </div>
          <div className="relative">
            <img
              src={selectedImage}
              alt="Trade chart"
              className="w-full h-32 object-contain rounded-lg border border-gray-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg flex items-end p-2">
              <span className="text-xs text-gray-300">AI will analyze this chart</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedImage(null)}
          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
        >
          <XCircle className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  };

  // Render conversation progress indicator
  const renderProgressIndicator = () => {
    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'initial' ? 'bg-trade-neon' :
          conversationStep === 'awaiting_direction' ? 'bg-trade-neon' :
            conversationStep === 'awaiting_details' ? 'bg-trade-neon' : 'bg-gray-600'
          }`}></div>
        <div className={`h-1 w-8 ${conversationStep === 'awaiting_direction' ||
          conversationStep === 'awaiting_details' ||
          conversationStep === 'analysis_complete' ? 'bg-trade-neon' : 'bg-gray-700'
          }`}></div>
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'awaiting_direction' ||
          conversationStep === 'awaiting_details' ||
          conversationStep === 'analysis_complete' ? 'bg-trade-neon' : 'bg-gray-600'
          }`}></div>
        <div className={`h-1 w-8 ${conversationStep === 'awaiting_details' ||
          conversationStep === 'analysis_complete' ? 'bg-trade-neon' : 'bg-gray-700'
          }`}></div>
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'awaiting_details' ||
          conversationStep === 'analysis_complete' ? 'bg-trade-neon' : 'bg-gray-600'
          }`}></div>
        <div className={`h-1 w-8 ${conversationStep === 'analysis_complete' ? 'bg-trade-neon' : 'bg-gray-700'
          }`}></div>
        <div className={`h-2 w-2 rounded-full ${conversationStep === 'analysis_complete' ? 'bg-trade-neon' : 'bg-gray-600'
          }`}></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] bg-trade-dark rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
      {/* Header with enhanced styling */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="font-bold text-xl text-white">AI Trade Validator</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Powered by</span>
            <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Gemini 2.5 Flash
            </span>
          </div>
        </div>
        {renderProgressIndicator()}
      </div>

      {/* Chat Area with enhanced styling */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-gray-900/50 to-gray-900">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
              ? 'bg-gradient-to-br from-trade-accent to-blue-600 text-white rounded-tr-none'
              : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 rounded-tl-none border border-gray-700 shadow-lg'
              }`}>
              {/* User message header */}
              {msg.role === 'user' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs font-bold">U</span>
                  </div>
                  <span className="text-xs font-medium opacity-80">You</span>
                </div>
              )}

              {/* AI message header */}
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <span className="text-xs font-medium text-gray-400">AI Risk Manager</span>
                </div>
              )}

              {renderMessageContent(msg)}

              <div className="text-[10px] opacity-50 mt-3 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700 shadow-lg max-w-[85%]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">AI</span>
                </div>
                <span className="text-xs font-medium text-gray-400">AI Risk Manager</span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-trade-neon" />
                <div className="space-y-2">
                  <span className="text-sm text-gray-300">Analyzing your trade setup...</span>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 bg-trade-neon rounded-full animate-bounce"></div>
                    <div className="h-1 w-1 bg-trade-neon rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-1 w-1 bg-trade-neon rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with enhanced styling */}
      <div className="p-4 bg-gray-900/80 border-t border-gray-700 backdrop-blur-sm">
        {renderImagePreview()}

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-trade-neon hover:bg-gray-800 rounded-lg transition"
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
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-trade-neon focus:ring-1 focus:ring-trade-neon transition"
              disabled={isAnalyzing || loadingRules}
            />
            {conversationStep === 'awaiting_details' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-trade-neon">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={isAnalyzing || (!inputText && !selectedImage) || loadingRules}
            className="bg-gradient-to-br from-trade-accent to-blue-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-trade-accent disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center flex flex-wrap justify-center gap-2">
          {loadingRules ? (
            <span>Loading your rules...</span>
          ) : (
            <>
              <span>Using <span className="text-yellow-500">{userRules.length} rules</span> for validation.</span>
              {conversationStep === 'awaiting_details' && (
                <span className="text-trade-neon flex items-center gap-1">
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
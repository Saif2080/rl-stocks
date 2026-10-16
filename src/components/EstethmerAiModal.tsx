import React, { useState } from 'react';
import { X, Sparkles, Brain, Send, Loader2, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { ActionType, AgentObservation, StockProfile, TradeRecord } from '../rl/types.ts';

interface EstethmerAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockProfile;
  currentObservation: AgentObservation;
  currentQValues: [number, number, number];
  recommendedAction: ActionType;
  confidence: number;
  portfolio: {
    cash: number;
    shares: number;
    portfolioValue: number;
    entryPrice: number;
  };
  recentTrades: TradeRecord[];
}

export const EstethmerAiModal: React.FC<EstethmerAiModalProps> = ({
  isOpen,
  onClose,
  stock,
  currentObservation,
  currentQValues,
  recommendedAction,
  confidence,
  portfolio,
  recentTrades,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'chat'>('audit');
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; text: string; time: string }[]
  >([
    {
      role: 'assistant',
      text: `Welcome to Estethmer AI! I am your quantitative assistant for the Egyptian Exchange (EGX). I can explain the Reinforcement Learning agent's Q-values and Bellman decisions, analyze EGX market macro factors (CBE rates, inflation, foreign flows), or evaluate ${stock.nameEn} (${stock.symbol}.CA). How can I assist you?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  if (!isOpen) return null;

  const currentPrice = currentObservation.rawValues.close;

  const handleRequestAudit = async () => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch('/api/gemini/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          stockNameEn: stock.nameEn,
          stockNameAr: stock.nameAr,
          sectorEn: stock.sectorEn,
          currentPrice,
          action: recommendedAction,
          qValues: currentQValues,
          confidence,
          technicals: {
            rsi: currentObservation.rawValues.rsi,
            ema9: currentObservation.rawValues.ema9,
            ema21: currentObservation.rawValues.ema21,
            macdHist: currentObservation.rawValues.macdHist,
            unrealizedPnlPct: currentObservation.rawValues.unrealizedPnlPct * 100,
          },
          recentTrades: recentTrades.slice(-5),
          portfolio,
        }),
      });

      const data = await res.json();
      if (data.audit) {
        setAuditReport(data.audit);
        setModelUsed(data.modelUsed || 'gemini-4-argon');
      } else {
        setAuditReport('Could not generate audit report. Please check API credentials.');
      }
    } catch (err: any) {
      setAuditReport(`Error generating audit: ${err?.message || err}`);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || userInput;
    if (!textToSend.trim() || isSendingChat) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgList = [...chatMessages, { role: 'user' as const, text: textToSend, time: timeStr }];
    setChatMessages(newMsgList);
    setUserInput('');
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgList.map((m) => ({ role: m.role, content: m.text })),
          context: {
            symbol: stock.symbol,
            action: recommendedAction,
            portfolioValue: portfolio.portfolioValue,
          },
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'عفواً، حدث خطأ أثناء المعالجة.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'عذراً، تعذر الاتصال بمستشار استثمر في الوقت الحالي.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const presetQuestions = [
    `Is current ${recommendedAction} signal sound given CBE monetary stance?`,
    'How does the Bellman equation determine Q-values on EGX?',
    'What are the EGX stamp fees and MCDR settlement rules?',
    `Key technical support and resistance zones for ${stock.symbol}?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Estethmer AI Intelligence
                  <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                    Estethmer
                  </span>
                </h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                  Gemini High Thinking
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditing {stock.nameEn} • Current Action: {recommendedAction}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded transition font-medium ${
                  activeTab === 'audit'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Deep RL Audit
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded transition font-medium ${
                  activeTab === 'chat'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Copilot Chat
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
          {activeTab === 'audit' ? (
            <div className="space-y-4">
              {/* Asset Snapshot Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Equity</span>
                  <span className="font-bold text-white font-mono">{stock.symbol}.CA</span>
                  <span className="text-[10px] text-slate-400 block truncate">{stock.sectorEn}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Price / Action</span>
                  <span className="font-bold text-emerald-400 font-mono">{currentPrice.toFixed(2)} EGP</span>
                  <span
                    className={`text-[10px] font-bold block ${
                      recommendedAction === 'BUY'
                        ? 'text-emerald-400'
                        : recommendedAction === 'SELL'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {recommendedAction} ({confidence}%)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">RSI / Trend</span>
                  <span className="font-mono text-cyan-300">RSI: {currentObservation.rawValues.rsi}</span>
                  <span className="text-[10px] text-slate-400 block">
                    EMA9: {currentObservation.rawValues.ema9.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Q-Values</span>
                  <span className="font-mono text-[10px] text-slate-300 block">
                    H: {currentQValues[0].toFixed(2)} | B: {currentQValues[1].toFixed(2)} | S:{' '}
                    {currentQValues[2].toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Run Audit Action Button */}
              {!auditReport && !isLoadingAudit && (
                <div className="text-center py-6 space-y-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Generate Estethmer High-Thinking Audit
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Our Gemini AI model with high thinking will review the RL policy decisions,
                      detect risks, verify against Egyptian macro trends, and formulate an executive verdict.
                    </p>
                  </div>
                  <button
                    onClick={handleRequestAudit}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run Deep Thinking Audit (Estethmer Intelligence)</span>
                  </button>
                </div>
              )}

              {isLoadingAudit && (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">
                      Estethmer Thinking Engine in Progress...
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      Evaluating Q-values optimality • Analyzing EGX market dynamics • Formulating verdict
                    </p>
                  </div>
                </div>
              )}

              {auditReport && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Executive Strategy Audit Report
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        Model: {modelUsed} (High Thinking)
                      </span>
                      <button
                        onClick={handleRequestAudit}
                        disabled={isLoadingAudit}
                        className="text-[11px] text-emerald-400 hover:underline font-semibold"
                      >
                        Re-evaluate
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-slate-200 leading-relaxed font-sans whitespace-pre-line text-xs">
                    {auditReport}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Copilot Chat Tab */
            <div className="flex flex-col h-[480px]">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-arabic'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">
                      {msg.time}
                    </span>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>مستشار استثمر يكتب الآن...</span>
                  </div>
                )}
              </div>

              {/* Preset Chips */}
              <div className="pt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="shrink-0 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-[10px] transition font-arabic"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="pt-2 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask Estethmer AI about EGX stocks, RL policy, CBE rates..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isSendingChat}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition active:scale-95 shadow-md shadow-emerald-950"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

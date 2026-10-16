import React, { useState } from 'react';
import {
  X,
  User,
  LogOut,
  LogIn,
  Bookmark,
  Sliders,
  Trash2,
  Play,
  CheckCircle2,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth, SavedStrategyRecord } from '../context/AuthContext.tsx';
import { EGX_STOCKS } from '../rl/egx_data.ts';
import { StockProfile, TrainingHyperparameters } from '../rl/types.ts';

interface UserCloudDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (stock: StockProfile) => void;
  onLoadStrategy: (hyperparams: TrainingHyperparameters) => void;
}

export const UserCloudDrawer: React.FC<UserCloudDrawerProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  onLoadStrategy,
}) => {
  const { user, signInWithGoogle, signOutUser, watchlist, toggleWatchlist, savedStrategies, deleteStrategy } =
    useAuth();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'strategies'>('watchlist');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>Firebase Cloud Account & Persistence</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[9px]">
                  Firestore
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {user ? user.email : 'Sign in with Google to sync watchlists and RL strategies'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Status Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-emerald-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <span className="font-bold text-white text-[11px] block">{user.displayName || 'Trader'}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Google Authenticated
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-[11px]">
              Guest session • Data stored locally until authenticated
            </div>
          )}

          <div>
            {user ? (
              <button
                onClick={signOutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-mono">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'watchlist'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>EGX Watchlist ({watchlist.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('strategies')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'strategies'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Saved RL Policies ({savedStrategies.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {activeTab === 'watchlist' && (
            <div>
              <p className="text-slate-400 text-[11px] mb-3">
                Pinned Egyptian stocks synced to your Firestore cloud profile:
              </p>

              {watchlist.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-mono">
                  Your watchlist is empty. Pin EGX stocks by clicking the bookmark icon in the stock universe.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {watchlist.map((sym) => {
                    const matched = EGX_STOCKS.find((s) => s.symbol === sym);
                    return (
                      <div
                        key={sym}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-sm font-mono">{sym}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {matched?.nameEn || 'Egyptian Equity'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {matched && (
                            <button
                              onClick={() => {
                                onSelectStock(matched);
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-[10px] flex items-center gap-1"
                            >
                              <Play className="w-2.5 h-2.5" />
                              <span>Trade</span>
                            </button>
                          )}

                          <button
                            onClick={() => toggleWatchlist(sym)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'strategies' && (
            <div>
              <p className="text-slate-400 text-[11px] mb-3">
                Saved Reinforcement Learning models, hyperparameters, and convergence snapshots:
              </p>

              {savedStrategies.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-mono">
                  No saved policies yet. Train the agent in the RL Studio and click "Save Strategy to Cloud".
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedStrategies.map((strat) => (
                    <div
                      key={strat.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs font-mono">{strat.name}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                          {strat.symbol} • {strat.totalEpisodesTrained} Episodes
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded">
                        <div>
                          Return: <strong className="text-emerald-400">+{strat.finalReturnPct}%</strong>
                        </div>
                        <div>
                          Win Rate: <strong className="text-cyan-400">{strat.winRate}%</strong>
                        </div>
                        <div>
                          Objective: <strong className="text-slate-300">{strat.rewardStrategy}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Saved: {new Date(strat.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onLoadStrategy({
                                learningRate: strat.learningRate,
                                discountFactor: strat.discountFactor,
                                epsilon: 0.2,
                                epsilonDecay: 0.96,
                                minEpsilon: 0.05,
                                rewardStrategy: strat.rewardStrategy as any,
                              });
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm"
                          >
                            <Play className="w-3 h-3" />
                            <span>Load Policy</span>
                          </button>

                          <button
                            onClick={() => deleteStrategy(strat.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400"
                            title="Delete strategy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

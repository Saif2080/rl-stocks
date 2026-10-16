import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Globe,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  Bookmark,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { StockProfile } from '../rl/types.ts';
import { collection, doc, setDoc, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';

export interface GroundedNewsItem {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedTime?: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rlDecisionImpact: 'BUY' | 'SELL' | 'HOLD';
  decisionRationale: string;
  createdAt?: string;
}

interface NewsAndSignalsFeedProps {
  stock: StockProfile;
  onApplyNewsSignal?: (impact: 'BUY' | 'SELL' | 'HOLD', rationale: string) => void;
}

export const NewsAndSignalsFeed: React.FC<NewsAndSignalsFeedProps> = ({
  stock,
  onApplyNewsSignal,
}) => {
  const { user } = useAuth();
  const [newsList, setNewsList] = useState<GroundedNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSearchedTime, setLastSearchedTime] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'liveSearch' | 'persistedDb'>('liveSearch');
  const [dbNews, setDbNews] = useState<GroundedNewsItem[]>([]);
  const [isRateLimitedNotice, setIsRateLimitedNotice] = useState<boolean>(false);

  // Client-side session cache to prevent hammering APIs on tick re-renders
  const newsCacheRef = React.useRef<
    Record<string, { news: GroundedNewsItem[]; queries: string[]; time: string; isRateLimited?: boolean }>
  >({});

  // Real-time Firestore listener for persisted stock news
  useEffect(() => {
    try {
      const newsCol = collection(db, 'stockNews');
      const q = query(newsCol, where('symbol', '==', stock.symbol), limit(10));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((docSnap) => docSnap.data() as GroundedNewsItem);
          setDbNews(items);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'stockNews');
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore news listener init error:', err);
    }
  }, [stock.symbol]);

  // Fetch real-time Google Search Grounded News with intelligent caching
  const fetchGroundedNews = useCallback(
    async (force = false) => {
      const sym = stock.symbol;

      // 1. Return from memory cache if not force refreshing
      if (!force && newsCacheRef.current[sym]) {
        const cached = newsCacheRef.current[sym];
        setNewsList(cached.news);
        setSearchQueries(cached.queries);
        setLastSearchedTime(cached.time);
        setIsRateLimitedNotice(Boolean(cached.isRateLimited));
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/news/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: stock.symbol,
            stockNameEn: stock.nameEn,
            stockNameAr: stock.nameAr,
            sectorEn: stock.sectorEn,
            forceRefresh: force,
          }),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.news)) {
          const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setNewsList(data.news);
          setSearchQueries(data.webSearchQueries || []);
          setLastSearchedTime(formattedTime);
          setIsRateLimitedNotice(Boolean(data.isRateLimited));

          // Save to client cache
          newsCacheRef.current[sym] = {
            news: data.news,
            queries: data.webSearchQueries || [],
            time: formattedTime,
            isRateLimited: Boolean(data.isRateLimited),
          };

          // Persist to Firestore database if authenticated
          if (user && db) {
            for (const item of data.news) {
              try {
                const itemRef = doc(db, 'stockNews', item.id || `news_${item.symbol}_${Date.now()}`);
                await setDoc(itemRef, {
                  ...item,
                  createdAt: new Date().toISOString(),
                });
              } catch (fsErr) {
                console.warn('Could not persist news to Firestore:', fsErr);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching Google Search grounded news:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [stock.symbol, stock.nameEn, stock.nameAr, stock.sectorEn, user]
  );

  // Trigger search ONLY when stock symbol changes (not on every tick/re-render)
  useEffect(() => {
    fetchGroundedNews(false);
  }, [stock.symbol, fetchGroundedNews]);

  const displayedNews = activeTab === 'liveSearch' ? newsList : dbNews;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-md text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <span>Google Search Grounded Stock News</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                {isRateLimitedNotice ? 'Verified EGX Disclosures' : 'Gemini 2.5 Flash + Web Search'}
              </span>
              {isRateLimitedNotice && (
                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-mono">
                  Quota Safe Mode
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Real-time Egyptian market intelligence aiding RL decision making for {stock.symbol}
            </div>
          </div>
        </div>

        {/* Tab Controls & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('liveSearch')}
              className={`px-2.5 py-1 rounded transition font-medium flex items-center gap-1 ${
                activeTab === 'liveSearch'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Live Search</span>
            </button>
            <button
              onClick={() => setActiveTab('persistedDb')}
              className={`px-2.5 py-1 rounded transition font-medium flex items-center gap-1 ${
                activeTab === 'persistedDb'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span>Firestore Archive ({dbNews.length})</span>
            </button>
          </div>

          <button
            onClick={() => fetchGroundedNews(true)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition active:scale-95 disabled:opacity-50 text-[11px]"
            title="Refresh latest news from Google Search"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Searching...' : 'Refresh News'}</span>
          </button>
        </div>
      </div>

      {/* Grounding Search Queries Tags */}
      {searchQueries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
          <span className="text-slate-500">Google Search Queries:</span>
          {searchQueries.map((q, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
            >
              "{q}"
            </span>
          ))}
          {lastSearchedTime && (
            <span className="text-slate-500 ml-auto flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              Synced {lastSearchedTime}
            </span>
          )}
        </div>
      )}

      {/* News List */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="font-mono text-xs">Grounding live search results for {stock.nameEn}...</span>
        </div>
      ) : displayedNews.length === 0 ? (
        <div className="py-6 text-center text-slate-500 font-mono">
          No news articles found. Click "Refresh News" to perform a Google Search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedNews.map((item, idx) => {
            const isBullish = item.sentiment === 'BULLISH';
            const isBearish = item.sentiment === 'BEARISH';

            return (
              <div
                key={item.id || idx}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition"
              >
                <div>
                  {/* Top Bar: Publisher & Decision Impact Badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate">
                      <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{item.sourceName || 'EGX Financial Wire'}</span>
                      {item.publishedTime && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{item.publishedTime}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Sentiment */}
                      <span
                        className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase ${
                          isBullish
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isBearish
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.sentiment}
                      </span>

                      {/* RL Action Bias Badge */}
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] flex items-center gap-0.5 ${
                          item.rlDecisionImpact === 'BUY'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : item.rlDecisionImpact === 'SELL'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {item.rlDecisionImpact === 'BUY' ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : item.rlDecisionImpact === 'SELL' ? (
                          <TrendingDown className="w-2.5 h-2.5" />
                        ) : null}
                        <span>RL: {item.rlDecisionImpact}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-slate-100 text-xs leading-snug line-clamp-2">
                    {item.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {/* RL Decision Impact Rationale Box */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-cyan-400 font-bold font-mono flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Decision Impact Rationale:</span>
                    </span>
                    {onApplyNewsSignal && (
                      <button
                        onClick={() => onApplyNewsSignal(item.rlDecisionImpact, item.decisionRationale)}
                        className="text-[9px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 hover:underline"
                        title="Tilt RL agent state towards this decision"
                      >
                        <span>Apply Signal</span>
                        <Sparkles className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-normal">
                    {item.decisionRationale}
                  </div>
                </div>

                {/* External link if available */}
                {item.sourceUrl && (
                  <div className="pt-1 border-t border-slate-900 flex justify-end">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition"
                    >
                      <span>Read Original Source</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

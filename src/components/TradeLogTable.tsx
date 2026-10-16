import React from 'react';
import { TradeRecord } from '../rl/types.ts';
import { ListOrdered, TrendingUp, TrendingDown } from 'lucide-react';

interface TradeLogTableProps {
  trades: TradeRecord[];
}

export const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Execution Log & Order Ledger (EGX Trades)
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total Executions: {trades.length}
        </span>
      </div>

      {trades.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-xs text-slate-500 gap-1 border border-dashed border-slate-800 rounded-lg">
          <span>No trades executed yet.</span>
          <span className="text-[10px] text-slate-600">
            Step through the historical simulation or click &quot;Auto Play Agent&quot; to execute Buy and Sell actions.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-slate-800">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-2">#Step</th>
                <th className="p-2">Date</th>
                <th className="p-2">Action</th>
                <th className="p-2 text-right">Price (EGP)</th>
                <th className="p-2 text-right">Shares</th>
                <th className="p-2 text-right">EGX Fee</th>
                <th className="p-2 text-right">Realized PnL</th>
                <th className="p-2 text-right">Portfolio Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {trades
                .slice()
                .reverse()
                .map((t, idx) => {
                  const isBuy = t.action === 'BUY';
                  return (
                    <tr key={t.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-2 text-slate-400">#{t.step}</td>
                      <td className="p-2 text-slate-300 whitespace-nowrap">{t.date}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            isBuy
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/60'
                              : 'bg-rose-950/90 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {isBuy ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )}
                          {t.action}
                        </span>
                      </td>
                      <td className="p-2 text-right text-white font-semibold">
                        {t.price.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-slate-300">{t.shares}</td>
                      <td className="p-2 text-right text-slate-400 text-[11px]">
                        {t.fees.toFixed(2)}
                      </td>
                      <td
                        className={`p-2 text-right font-bold ${
                          t.pnlRealized === undefined
                            ? 'text-slate-600'
                            : t.pnlRealized >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                        }`}
                      >
                        {t.pnlRealized !== undefined
                          ? `${t.pnlRealized >= 0 ? '+' : ''}${t.pnlRealized.toFixed(2)} (${t.pnlPct?.toFixed(1)}%)`
                          : '—'}
                      </td>
                      <td className="p-2 text-right text-cyan-300 font-bold">
                        {t.portfolioValue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

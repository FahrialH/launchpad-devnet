import React from 'react';
import { TokenomicsConfig } from '../types';

interface TokenomicsProps {
  tokenomics: TokenomicsConfig;
  symbol: string;
}

const COLORS = [
  '#9945FF', // Solana purple
  '#14F195', // Solana green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Indigo
];

export const Tokenomics: React.FC<TokenomicsProps> = ({ tokenomics, symbol }) => {
  const { totalSupply, ...allocations } = tokenomics;

  const chartData = Object.entries(allocations)
    .filter(([_, val]) => val !== undefined)
    .map(([key, val]) => {
      const numericVal = parseFloat((val || '0').replace('%', ''));
      const formattedName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return {
        name: formattedName,
        value: numericVal,
        percentageStr: val,
      };
    });

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Tokenomics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Token distribution & total supply details</p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Supply</span>
          <span className="text-lg font-bold font-mono text-white">{totalSupply} <span className="text-xs text-purple-400 font-sans">${symbol}</span></span>
        </div>
      </div>

      {/* Visual Bar Distribution */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Allocation Breakdown</span>
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-950 p-0.5 border border-slate-800">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              style={{
                width: `${item.value}%`,
                backgroundColor: COLORS[index % COLORS.length],
              }}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full hover:opacity-80"
              title={`${item.name}: ${item.percentageStr}`}
            />
          ))}
        </div>
      </div>

      {/* Allocation List Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {chartData.map((item, index) => (
          <div key={item.name} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs font-medium text-slate-300 truncate">{item.name}</span>
            </div>
            <div className="text-lg font-extrabold text-white font-mono">{item.percentageStr}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

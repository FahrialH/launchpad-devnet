import React from 'react';
import { SaleStatusType } from '../types';
import { Radio, Clock, CheckCircle2 } from 'lucide-react';

interface SaleStatusProps {
  status: SaleStatusType;
}

export const SaleStatus: React.FC<SaleStatusProps> = ({ status }) => {
  if (status === 'live') {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <Radio className="w-3.5 h-3.5" />
        <span>Sale Live</span>
      </div>
    );
  }

  if (status === 'upcoming') {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
        <Clock className="w-3.5 h-3.5" />
        <span>Upcoming</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Sale Ended</span>
    </div>
  );
};

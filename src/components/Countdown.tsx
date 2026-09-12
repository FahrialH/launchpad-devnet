import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string; // ISO date string
  label: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, label }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-4 text-center">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
        {label}
      </span>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="flex flex-col p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="font-mono text-xl sm:text-2xl font-black text-white">{pad(timeLeft.days)}</span>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5">Days</span>
        </div>
        <div className="flex flex-col p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="font-mono text-xl sm:text-2xl font-black text-white">{pad(timeLeft.hours)}</span>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5">Hours</span>
        </div>
        <div className="flex flex-col p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="font-mono text-xl sm:text-2xl font-black text-white">{pad(timeLeft.minutes)}</span>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5">Mins</span>
        </div>
        <div className="flex flex-col p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="font-mono text-xl sm:text-2xl font-black text-purple-400">{pad(timeLeft.seconds)}</span>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5">Secs</span>
        </div>
      </div>
    </div>
  );
};

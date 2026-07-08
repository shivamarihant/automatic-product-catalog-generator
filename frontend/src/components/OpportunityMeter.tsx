import React from 'react';

interface OpportunityMeterProps {
  score: number;
}

export const OpportunityMeter: React.FC<OpportunityMeterProps> = ({ score }) => {
  let statusColor = 'text-red-600 border-red-200 bg-red-50';
  let statusText = 'High Sourcing Resistance';
  let strokeColor = 'stroke-red-500';
  
  if (score >= 80) {
    statusColor = 'text-emerald-600 border-emerald-200 bg-emerald-50';
    statusText = 'Excellent Sourcing Node';
    strokeColor = 'stroke-emerald-500';
  } else if (score >= 60) {
    statusColor = 'text-brand-600 border-brand-200 bg-brand-50';
    statusText = 'Strong Launch Potential';
    strokeColor = 'stroke-brand-500';
  } else if (score >= 45) {
    statusColor = 'text-amber-600 border-amber-200 bg-amber-50';
    statusText = 'Moderate Sourcing Risk';
    strokeColor = 'stroke-amber-500';
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Sourcing Opportunity Score</h3>
      
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-slate-800 leading-none">{score}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">out of 100</span>
        </div>
      </div>

      <div className={`mt-5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border ${statusColor}`}>
        {statusText}
      </div>

      <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-[240px]">
        Calculated dynamically based on gross profit margin %, local logistics RTO risk, Amazon international traction, and Meta ads volume.
      </p>
    </div>
  );
};

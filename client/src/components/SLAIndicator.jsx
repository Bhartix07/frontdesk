import React from 'react';
import { Clock, AlertTriangle, CheckCircle, PauseCircle, Compass } from 'lucide-react';

export default function SLAIndicator({ ticket, compact = false }) {
  if (!ticket) return null;

  const sla = ticket.slaEvaluation;
  const isWaiting = ticket.status === 'WAITING_ON_CUSTOMER';
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  // Format remaining minutes into human hours/minutes
  const formatRemaining = (minutes) => {
    if (minutes <= 0) return 'Delayed / Breached';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs === 0) return `${mins}m working window`;
    return `${hrs}h ${mins}m working window`;
  };

  // Signal badges
  const getBadge = (slaData, label) => {
    if (!slaData) return null;

    if (slaData.status === 'MET') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_6px_#059669]" />
          {label}: On Schedule (Met)
        </span>
      );
    }

    if (slaData.isBreached || slaData.status === 'BREACHED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-600 shadow-[0_0_6px_#dc2626]" />
          {label}: Delayed / Breached
        </span>
      );
    }

    if (isWaiting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#d97706]" />
          {label}: Signal Hold (Paused)
        </span>
      );
    }

    // Active Running
    const isUrgent = slaData.remainingMinutes < 120;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
        isUrgent 
          ? 'bg-amber-50 text-amber-800 border-amber-300' 
          : 'bg-blue-50 text-blue-800 border-blue-200'
      }`}>
        <Clock className="w-3.5 h-3.5 text-blue-600" />
        {label}: {formatRemaining(slaData.remainingMinutes)}
      </span>
    );
  };

  if (compact) {
    if (sla?.isOverallBreached || ticket.isFirstReplyBreached || ticket.isResolutionBreached) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          Signal Red (Late)
        </span>
      );
    }

    if (isWaiting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Signal Hold (Paused)
        </span>
      );
    }

    if (isResolved) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Arrived (Resolved)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
        <Clock className="w-3 h-3 text-slate-600" />
        {formatRemaining(sla?.reply?.remainingMinutes || sla?.resolution?.remainingMinutes || 120)}
      </span>
    );
  }

  // Full detailed indicator
  return (
    <div className="bg-[#0f2445] text-white border-2 border-amber-500/60 rounded-xl p-4 sm:p-5 shadow-lg space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
            SLA Station Schedule Monitor
          </span>
        </div>
        <span className="text-xs text-slate-300 font-mono bg-black/30 px-2.5 py-0.5 rounded border border-white/10">
          Operating Window: 09:30 – 18:30 (Mon–Fri)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Reply SLA */}
        <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-lg border border-white/15 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            First Response Schedule
          </div>
          <div>{getBadge(sla?.reply, 'Reply')}</div>
          <div className="text-xs text-amber-200/90 font-mono">
            Target Due: {new Date(ticket.firstReplyDueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Resolution SLA */}
        <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-lg border border-white/15 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Final Resolution Schedule
          </div>
          <div>{getBadge(sla?.resolution, 'Resolution')}</div>
          <div className="text-xs text-amber-200/90 font-mono">
            Target Due: {new Date(ticket.resolutionDueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {isWaiting && (
        <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-3 flex items-center gap-2.5 text-xs text-amber-200">
          <PauseCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Signal Hold Active:</strong> Ticket is waiting on passenger/customer reply. Time spent in this state is credited back to Arvo and does not count against SLA deadlines.
          </span>
        </div>
      )}
    </div>
  );
}

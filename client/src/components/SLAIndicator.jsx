import React from 'react';
import { Clock, AlertTriangle, CheckCircle, PauseCircle } from 'lucide-react';

export default function SLAIndicator({ ticket, compact = false }) {
  if (!ticket) return null;

  const sla = ticket.slaEvaluation;
  const isWaiting = ticket.status === 'WAITING_ON_CUSTOMER';
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  // Format remaining minutes into human hours/minutes
  const formatRemaining = (minutes) => {
    if (minutes <= 0) return 'Breached';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hrs === 0) return `${mins}m working time`;
    return `${hrs}h ${mins}m working time`;
  };

  // Helper for status badge
  const getBadge = (slaData, label) => {
    if (!slaData) return null;

    if (slaData.status === 'MET') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          {label}: Met
        </span>
      );
    }

    if (slaData.isBreached || slaData.status === 'BREACHED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {label}: Breached
        </span>
      );
    }

    if (isWaiting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          {label}: Paused (Waiting)
        </span>
      );
    }

    // Active
    const isUrgent = slaData.remainingMinutes < 120; // less than 2 working hours
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isUrgent 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : 'bg-blue-50 text-blue-700 border-blue-200'
      }`}>
        <Clock className="w-3.5 h-3.5" />
        {label}: {formatRemaining(slaData.remainingMinutes)}
      </span>
    );
  };

  if (compact) {
    if (sla?.isOverallBreached || ticket.isFirstReplyBreached || ticket.isResolutionBreached) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          SLA Breached
        </span>
      );
    }

    if (isWaiting) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <PauseCircle className="w-3 h-3 text-amber-600" />
          SLA Paused
        </span>
      );
    }

    if (isResolved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          Resolved
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3 text-blue-600" />
        {formatRemaining(sla?.reply?.remainingMinutes || sla?.resolution?.remainingMinutes || 120)}
      </span>
    );
  }

  // Full detailed indicator
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            SLA Working Hours Monitor
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          09:30 - 18:30 (Mon-Fri)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Reply SLA */}
        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm space-y-1.5">
          <div className="text-xs font-medium text-slate-500">First Response SLA</div>
          <div>{getBadge(sla?.reply, 'Reply')}</div>
          <div className="text-[11px] text-slate-400">
            Target Due: {new Date(ticket.firstReplyDueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Resolution SLA */}
        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm space-y-1.5">
          <div className="text-xs font-medium text-slate-500">Resolution SLA</div>
          <div>{getBadge(sla?.resolution, 'Resolution')}</div>
          <div className="text-[11px] text-slate-400">
            Target Due: {new Date(ticket.resolutionDueAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {isWaiting && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-800">
          <PauseCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Timer Paused:</strong> Ticket is waiting on customer reply. Elapsed time during this period is not counted against Arvo's SLA commitments.
          </span>
        </div>
      )}
    </div>
  );
}

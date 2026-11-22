import React from 'react';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  MessageSquare, 
  FileText, 
  PauseCircle, 
  PlayCircle,
  ShieldCheck 
} from 'lucide-react';

export default function ActivityTimeline({ auditLogs = [] }) {
  const getActionMeta = (action) => {
    switch (action) {
      case 'TICKET_CREATED':
        return {
          icon: <History className="w-3.5 h-3.5 text-blue-600" />,
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          title: 'Ticket Created'
        };
      case 'TICKET_CLAIMED':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600" />,
          color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
          title: 'Ticket Claimed'
        };
      case 'TICKET_REASSIGNED':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-indigo-600" />,
          color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
          title: 'Ticket Reassigned'
        };
      case 'PRIORITY_CHANGED':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
          color: 'bg-amber-100 border-amber-300 text-amber-800',
          title: 'Priority & SLA Recalculated'
        };
      case 'STATUS_CHANGED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
          color: 'bg-teal-100 border-teal-300 text-teal-800',
          title: 'Status Updated'
        };
      case 'AGENT_REPLIED':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-purple-600" />,
          color: 'bg-purple-100 border-purple-300 text-purple-800',
          title: 'Agent Replied'
        };
      case 'CUSTOMER_REPLIED':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-sky-600" />,
          color: 'bg-sky-100 border-sky-300 text-sky-800',
          title: 'Customer Replied'
        };
      case 'INTERNAL_NOTE_ADDED':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-amber-600" />,
          color: 'bg-amber-100 border-amber-300 text-amber-800',
          title: 'Internal Note Added'
        };
      case 'SLA_BREACHED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-rose-600" />,
          color: 'bg-rose-100 border-rose-300 text-rose-800',
          title: 'SLA Breached'
        };
      case 'AUTO_CLOSED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
          color: 'bg-slate-100 border-slate-300 text-slate-800',
          title: 'Auto-Closed (Inactivity)'
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5 text-slate-600" />,
          color: 'bg-slate-100 border-slate-300 text-slate-800',
          title: action.replace(/_/g, ' ')
        };
    }
  };

  const parseDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch {
      return { raw: details };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header - Addresses INC-0318 */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Immutable Activity Audit Trail
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                INC-0318 Compliant
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tamper-evident record of exact events, authors, and timestamps.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Append-Only Log
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {auditLogs.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No activity recorded yet.</div>
        ) : (
          auditLogs.map((log) => {
            const meta = getActionMeta(log.action);
            const details = parseDetails(log.details);

            return (
              <div key={log.id} className="relative group">
                {/* Node icon on vertical line */}
                <div className="absolute -left-[27px] top-0.5 p-1 bg-white rounded-full border border-slate-300 shadow-xs">
                  {meta.icon}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">
                      {meta.title}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      by <strong className="text-slate-700">{log.actorName}</strong>
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                      log.actorType === 'CUSTOMER' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : log.actorType === 'SYSTEM' 
                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {log.actorType}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono ml-auto">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Render context details if available */}
                  {details && Object.keys(details).length > 0 && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded-md p-2 border border-slate-100 font-mono text-[11px]">
                      {details.preview && (
                        <p className="font-sans text-xs italic text-slate-700 mb-1">
                          "{details.preview}"
                        </p>
                      )}
                      {details.oldStatus && (
                        <div>Status: {details.oldStatus} &rarr; <strong>{details.newStatus}</strong></div>
                      )}
                      {details.oldPriority && (
                        <div>Priority: {details.oldPriority} &rarr; <strong>{details.newPriority}</strong></div>
                      )}
                      {details.reason && <div>Note: {details.reason}</div>}
                      {details.breachedTarget && (
                        <div className="text-rose-600 font-semibold">Breach: {details.breachedTarget}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

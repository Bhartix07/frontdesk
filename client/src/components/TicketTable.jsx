import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  UserPlus, 
  User, 
  ArrowUpRight,
  PauseCircle,
  MessageSquare,
  Lock
} from 'lucide-react';
import SLAIndicator from './SLAIndicator';

export default function TicketTable({ 
  tickets = [], 
  loading = false, 
  onClaimTicket, 
  currentAgent,
  filterView,
  onSelectFilterView
}) {
  const navigate = useNavigate();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            Critical
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{priority}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            In Progress
          </span>
        );
      case 'WAITING_ON_CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            Waiting on Customer
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Closed
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* View Filter Tabs - Meets Meera's requirement: "The agents need to see their tickets on one screen..." */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/50 overflow-x-auto text-xs">
        <span className="font-semibold text-slate-500 mr-1 hidden sm:inline">Views:</span>
        {[
          { key: 'ALL', label: 'All Tickets' },
          { key: 'MY_TICKETS', label: 'My Assigned Tickets' },
          { key: 'UNASSIGNED', label: 'Unassigned Pool' },
          { key: 'LATE_OR_BREACHED', label: '🚨 Late / Breached' },
          { key: 'WAITING_ON_CUSTOMER', label: '⏳ Waiting on Customer' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => onSelectFilterView(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterView === tab.key
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Subject & Customer</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">SLA Clock</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent" />
                  <p className="mt-2 text-xs">Loading Frontdesk tickets...</p>
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No tickets found matching this filter view.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const isAssignedToMe = ticket.assignedToId === currentAgent?.id;

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Ticket Number */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-sky-700 whitespace-nowrap">
                      {ticket.ticketNumber}
                    </td>

                    {/* Subject & Customer */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">
                        {ticket.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-700">{ticket.customer?.name}</span>
                        <span>•</span>
                        <span>{ticket.customer?.company || ticket.customer?.email}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>

                    {/* SLA Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SLAIndicator ticket={ticket} compact={true} />
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isAssignedToMe ? 'font-bold text-sky-700' : ''}>
                            {ticket.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Action: Take / Claim Ticket */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {!ticket.assignedTo ? (
                        <button
                          onClick={() => onClaimTicket(ticket.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-transparent text-xs font-semibold transition-all shadow-2xs"
                          title="Claim this ticket (Collision protected against double-claiming)"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Take Ticket</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

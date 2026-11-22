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
  Ticket,
  ChevronRight,
  QrCode
} from 'lucide-react';
import SLAIndicator from './SLAIndicator';
import { OfficerAvatar } from './TrainGraphics';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-black bg-rose-50 text-rose-800 border-l-4 border-rose-600 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            Superfast / Critical
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-800 border-l-4 border-amber-500 shadow-2xs">
            Express / Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border-l-4 border-slate-400">
            Passenger / Low
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
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Departed (Open)
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-[#0b1e3b]/10 text-[#0b1e3b] border border-[#0b1e3b]/20">
            In Transit
          </span>
        );
      case 'WAITING_ON_CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            Signal Hold
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Arrived (Resolved)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
            Archived (Closed)
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Platform Track Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-[#07172f] overflow-x-auto text-xs">
        <span className="font-black text-amber-400 mr-2 uppercase tracking-wider text-[11px] hidden sm:inline flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-amber-400" />
          Tracks:
        </span>
        {[
          { key: 'ALL', label: 'All Trains (Queue)' },
          { key: 'MY_TICKETS', label: 'My Assigned Queue' },
          { key: 'UNASSIGNED', label: 'Unassigned Platform' },
          { key: 'LATE_OR_BREACHED', label: '🚨 Signal Red (Delayed)' },
          { key: 'WAITING_ON_CUSTOMER', label: '⏳ Signal Hold (Waiting)' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => onSelectFilterView(tab.key)}
            className={`px-3.5 py-1.5 rounded font-black uppercase tracking-wider text-[11px] whitespace-nowrap transition-all ${
              filterView === tab.key
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#07172f] shadow-md scale-102'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Ticket Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider font-mono">
              <th className="py-3.5 px-4">Ticket PNR</th>
              <th className="py-3.5 px-4 font-sans">Subject & Passenger / Client</th>
              <th className="py-3.5 px-4 font-sans">Priority Class</th>
              <th className="py-3.5 px-4 font-sans">Transit Status</th>
              <th className="py-3.5 px-4 font-sans">SLA Schedule Clock</th>
              <th className="py-3.5 px-4 font-sans">Officer In-Charge</th>
              <th className="py-3.5 px-4 text-right font-sans">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-amber-500 border-t-transparent" />
                  <p className="mt-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Loading Central Ticket Register...</p>
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No tickets scheduled under this track filter.
                </td>
              </tr>
            ) : (
              tickets.map((ticket, idx) => {
                const isAssignedToMe = ticket.assignedToId === currentAgent?.id;

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className={`hover:bg-amber-50/50 cursor-pointer transition-colors group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Ticket Number / PNR */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-[#07172f] bg-amber-50 group-hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded shadow-2xs transition-colors">
                          {ticket.ticketNumber}
                        </span>
                      </div>
                    </td>

                    {/* Subject & Passenger/Company */}
                    <td className="py-4 px-4 max-w-xs sm:max-w-sm">
                      <div className="font-bold text-slate-900 line-clamp-1 group-hover:text-[#0b1e3b] transition-colors">
                        {ticket.title}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                        <span className="text-slate-800 font-bold">{ticket.customer?.name}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono text-[11px]">{ticket.customer?.company || ticket.customer?.email}</span>
                      </div>
                    </td>

                    {/* Priority Class */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>

                    {/* SLA Schedule Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <SLAIndicator ticket={ticket} compact={true} />
                    </td>

                    {/* Officer in Charge with Photo Avatar */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2 text-xs text-slate-800">
                          <OfficerAvatar name={ticket.assignedTo.name} role={ticket.assignedTo.role} size="sm" />
                          <span className={isAssignedToMe ? 'font-black text-[#0b1e3b] bg-amber-100 px-2 py-0.5 rounded' : 'font-semibold'}>
                            {ticket.assignedTo.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded font-bold border border-amber-300">
                          Unassigned Pool
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {!ticket.assignedTo ? (
                        <button
                          onClick={() => onClaimTicket(ticket.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#07172f] text-xs font-black shadow-sm transition-all uppercase tracking-wider"
                          title="Claim this ticket (Protected against simultaneous claim)"
                        >
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Take Ticket</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="p-1.5 text-slate-400 group-hover:text-[#0b1e3b] rounded hover:bg-slate-200 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
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

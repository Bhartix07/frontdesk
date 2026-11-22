import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Clock, ArrowRight, UserPlus } from 'lucide-react';
import SLAIndicator from './SLAIndicator';

export default function TicketCard({ ticket, onClaimTicket, currentAgent }) {
  const navigate = useNavigate();

  const isAssignedToMe = ticket.assignedToId === currentAgent?.id;

  return (
    <div 
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
    >
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
            {ticket.ticketNumber}
          </span>
          <SLAIndicator ticket={ticket} compact={true} />
        </div>

        <h4 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 text-sm">
          {ticket.title}
        </h4>

        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
          {ticket.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 truncate max-w-[160px]">
          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">
            {ticket.assignedTo ? (
              <span className={isAssignedToMe ? 'font-bold text-sky-700' : ''}>
                {ticket.assignedTo.name}
              </span>
            ) : (
              <em className="text-slate-400">Unassigned</em>
            )}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {!ticket.assignedTo ? (
            <button
              onClick={() => onClaimTicket(ticket.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Take
            </button>
          ) : (
            <span className="text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 text-xs font-medium">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

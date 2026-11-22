import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Send, 
  Lock, 
  History, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  PauseCircle,
  Eye,
  RotateCcw,
  Ticket,
  Compass
} from 'lucide-react';
import { ticketApi, agentApi } from '../services/api';
import SLAIndicator from '../components/SLAIndicator';
import InternalNotes from '../components/InternalNotes';
import ActivityTimeline from '../components/ActivityTimeline';

export default function TicketDetails({ currentAgent, onOpenCustomerSimulator }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversation');
  
  // Public message form
  const [replyContent, setReplyContent] = useState('');
  const [nextStatus, setNextStatus] = useState('WAITING_ON_CUSTOMER');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Collision state
  const [conflictError, setConflictError] = useState(null);

  useEffect(() => {
    loadTicket();
    loadAgents();
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getTicketDetails(id);
      setTicket(res.data.data);
      setConflictError(null);
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await agentApi.getAgents();
      setAgents(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Claim Ticket - Addresses INC-0291
  const handleClaim = async () => {
    if (!currentAgent) return;
    try {
      await ticketApi.claimTicket(ticket.id, currentAgent.id);
      await loadTicket();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message);
      } else {
        alert(err.response?.data?.message || 'Failed to claim ticket');
      }
      await loadTicket();
    }
  };

  // Reassign to another agent
  const handleReassign = async (targetAgentId) => {
    try {
      await ticketApi.assignTicket(
        ticket.id, 
        targetAgentId, 
        currentAgent?.id, 
        currentAgent?.name
      );
      await loadTicket();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign');
    }
  };

  // Change Priority - Addresses Meera's Section 3 meeting question
  const handlePriorityChange = async (newPriority) => {
    if (!currentAgent) return;
    const confirmMsg = `Recalculate SLA schedule for ${newPriority}? \n\nFrontdesk will deduct elapsed business hours from the new ${newPriority} schedule budget.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await ticketApi.updatePriority(ticket.id, newPriority, currentAgent.id, currentAgent.name);
      await loadTicket();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update priority');
    }
  };

  // Change Status - Handles Pause/Resume & Reopen
  const handleStatusChange = async (newStatus) => {
    if (!currentAgent) return;
    try {
      await ticketApi.updateStatus(
        ticket.id,
        newStatus,
        'AGENT',
        currentAgent.id,
        currentAgent.name,
        `Status updated by ${currentAgent.name}`
      );
      await loadTicket();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Send Public Reply to Customer
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      await ticketApi.addMessage(ticket.id, {
        senderType: 'AGENT',
        senderId: currentAgent?.id,
        senderName: currentAgent?.name || 'Support Agent',
        content: replyContent.trim()
      });

      // Optionally transition status if selected
      if (nextStatus && nextStatus !== ticket.status) {
        await ticketApi.updateStatus(
          ticket.id,
          nextStatus,
          'AGENT',
          currentAgent?.id,
          currentAgent?.name,
          `Status transitioned on dispatch response`
        );
      }

      setReplyContent('');
      await loadTicket();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Add Internal Note (INC-0304)
  const handleAddInternalNote = async (content) => {
    if (!currentAgent) return;
    await ticketApi.addInternalNote(ticket.id, currentAgent.id, content);
    await loadTicket();
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Retrieving Ticket Record...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Ticket not found in register.</p>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-3 px-4 py-2 bg-[#0b1e3b] text-white rounded-lg text-xs font-bold"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Breadcrumb & Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-lg bg-slate-100 text-[#0b1e3b] hover:bg-slate-200 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs text-[#0b1e3b] bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded">
                PNR: {ticket.ticketNumber}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Logged: {new Date(ticket.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCustomerSimulator(ticket.ticketNumber)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-500/50 bg-amber-50 text-amber-900 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition-colors"
            title="Verify passenger view to ensure private notes never leak"
          >
            <Eye className="w-4 h-4 text-amber-700" />
            Passenger View (Verify INC-0304)
          </button>
        </div>
      </div>

      {/* Collision Conflict Warning - Addresses INC-0291 */}
      {conflictError && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 flex items-start gap-3 text-rose-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide">Collision Protection Active (INC-0291)</h4>
            <p className="text-xs text-rose-800 mt-0.5 font-medium">{conflictError}</p>
          </div>
        </div>
      )}

      {/* SLA Engine Monitor Card */}
      <SLAIndicator ticket={ticket} />

      {/* Control Strip: Officer In-Charge, Priority Class, Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        {/* Officer in Charge */}
        <div className="space-y-1">
          <label className="text-slate-600 font-extrabold uppercase text-[10px] tracking-wider block">
            Officer In-Charge (INC-0291 Lock)
          </label>
          <div className="flex items-center gap-2">
            {!ticket.assignedTo ? (
              <button
                onClick={handleClaim}
                className="w-full py-2 px-3 rounded bg-amber-500 hover:bg-amber-400 text-[#0b1e3b] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                Claim This Ticket
              </button>
            ) : (
              <select
                value={ticket.assignedToId || ''}
                onChange={(e) => handleReassign(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b1e3b]"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Priority Class */}
        <div className="space-y-1">
          <label className="text-slate-600 font-extrabold uppercase text-[10px] tracking-wider block">
            Priority Class (Recalculates SLA)
          </label>
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b1e3b]"
          >
            <option value="CRITICAL">Superfast / Critical (2h Reply / Same Day)</option>
            <option value="MEDIUM">Express / Medium (4.5h Reply / 3 Days)</option>
            <option value="LOW">Passenger / Low (1 Day Reply / 1 Week)</option>
          </select>
        </div>

        {/* Transit Status */}
        <div className="space-y-1">
          <label className="text-slate-600 font-extrabold uppercase text-[10px] tracking-wider block">
            Transit Status
          </label>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b1e3b]"
          >
            <option value="OPEN">Departed (Open)</option>
            <option value="IN_PROGRESS">In Transit</option>
            <option value="WAITING_ON_CUSTOMER">Signal Hold (Pause SLA)</option>
            <option value="RESOLVED">Arrived (Resolved)</option>
            <option value="CLOSED">Archived (Closed)</option>
          </select>
        </div>

      </div>

      {/* Passenger Context Card */}
      <div className="bg-white border-l-4 border-l-[#0b1e3b] border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-black text-slate-500 block tracking-wider">
            Passenger / Client Details
          </span>
          <div className="font-extrabold text-slate-900 text-sm mt-0.5">
            {ticket.customer?.name}
          </div>
          <div className="text-slate-600 font-medium font-mono text-[11px]">
            {ticket.customer?.company || 'Standard Passenger'} • {ticket.customer?.email}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-md">
          <strong className="text-slate-900 block text-[11px] mb-0.5 uppercase tracking-wide">Initial Incident Statement:</strong>
          <p className="line-clamp-2 text-xs leading-relaxed">{ticket.description}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b-2 border-slate-200 space-x-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`pb-3 flex items-center gap-2 border-b-3 transition-colors ${
            activeTab === 'conversation'
              ? 'border-amber-500 text-[#0b1e3b]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Dispatch Communication</span>
          <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
            {ticket.messages?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('internal_notes')}
          className={`pb-3 flex items-center gap-2 border-b-3 transition-colors ${
            activeTab === 'internal_notes'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span>Staff Confidential Notes (INC-0304)</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono">
            {ticket.internalNotes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`pb-3 flex items-center gap-2 border-b-3 transition-colors ${
            activeTab === 'audit_trail'
              ? 'border-[#0b1e3b] text-[#0b1e3b]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Station Running Log (INC-0318)</span>
          <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
            {ticket.auditLogs?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'conversation' && (
          <div className="space-y-4">
            
            {/* Messages Stream */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4 max-h-[450px] overflow-y-auto">
              {ticket.messages?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  No public messages have been transmitted to passenger yet. Type below to send the first dispatch.
                </div>
              ) : (
                ticket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.senderType === 'AGENT' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 px-1">
                      <span className="font-bold text-slate-800">{m.senderName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono uppercase">
                        {m.senderType}
                      </span>
                      <span className="font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`p-3.5 rounded-xl text-xs max-w-lg leading-relaxed shadow-2xs whitespace-pre-wrap ${
                        m.senderType === 'AGENT'
                          ? 'bg-[#0b1e3b] text-white rounded-tr-xs'
                          : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Public Reply Form */}
            <form onSubmit={handleSendReply} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span>Dispatch Response to Passenger</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Authorized Officer: <strong>{currentAgent?.name}</strong>
                  </span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Draft an official response to the passenger..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0b1e3b] focus:bg-white resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600 font-bold uppercase text-[11px]">Set Signal Status:</span>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800"
                  >
                    <option value="WAITING_ON_CUSTOMER">Signal Hold (Pause SLA)</option>
                    <option value="IN_PROGRESS">Keep In Transit</option>
                    <option value="RESOLVED">Mark Arrived (Resolved)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-[#0b1e3b] text-xs font-black uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReply ? 'Transmitting...' : 'Dispatch Reply'}
                </button>
              </div>
            </form>

          </div>
        )}

        {activeTab === 'internal_notes' && (
          <InternalNotes
            notes={ticket.internalNotes || []}
            onAddNote={handleAddInternalNote}
            currentAgent={currentAgent}
          />
        )}

        {activeTab === 'audit_trail' && (
          <ActivityTimeline auditLogs={ticket.auditLogs || []} />
        )}
      </div>

    </div>
  );
}

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
  RotateCcw
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
  const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' | 'internal_notes' | 'audit_trail'
  
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
    const confirmMsg = `Are you sure you want to change priority to ${newPriority}? \n\nFrontdesk will recalculate the remaining SLA working hours budget by deducting the elapsed working time from the new ${newPriority} target.`;
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
          `Status transitioned on agent reply`
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-sky-600 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Ticket not found.</p>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-3 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const isAssignedToCurrentAgent = ticket.assignedToId === currentAgent?.id;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                Opened {new Date(ticket.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCustomerSimulator(ticket.ticketNumber)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            title="Inspect what customer sees for this ticket (INC-0304 check)"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect Customer View
          </button>
        </div>
      </div>

      {/* Collision Conflict Warning - Addresses INC-0291 */}
      {conflictError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex items-start gap-3 text-rose-900 animate-bounce">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Race Condition / Collision Detected (INC-0291)</h4>
            <p className="text-xs text-rose-700 mt-0.5">{conflictError}</p>
          </div>
        </div>
      )}

      {/* SLA Engine Monitor Card */}
      <SLAIndicator ticket={ticket} />

      {/* Control Strip: Assignee, Priority, Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        {/* Assignee Control */}
        <div className="space-y-1">
          <label className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">
            Assignee (INC-0291 Protected)
          </label>
          <div className="flex items-center gap-2">
            {!ticket.assignedTo ? (
              <button
                onClick={handleClaim}
                className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                Claim This Ticket
              </button>
            ) : (
              <select
                value={ticket.assignedToId || ''}
                onChange={(e) => handleReassign(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
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

        {/* Priority Control */}
        <div className="space-y-1">
          <label className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">
            Priority Tier (Auto-Recalculate SLA)
          </label>
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="CRITICAL">Critical (2h Reply / Same Day)</option>
            <option value="MEDIUM">Medium (4.5h Reply / 3 Days)</option>
            <option value="LOW">Low (1 Day Reply / 1 Week)</option>
          </select>
        </div>

        {/* Status Control */}
        <div className="space-y-1">
          <label className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">
            Lifecycle Status
          </label>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer (Pause SLA)</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

      </div>

      {/* Customer Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Customer Context
          </span>
          <div className="font-semibold text-slate-800 text-sm mt-0.5">
            {ticket.customer?.name}
          </div>
          <div className="text-slate-500">
            {ticket.customer?.company || 'Standard Account'} • {ticket.customer?.email}
          </div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 max-w-md">
          <strong className="text-slate-800 block text-[11px] mb-0.5">Original Issue Description:</strong>
          <p className="line-clamp-2 text-xs">{ticket.description}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'conversation'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reply to Customer</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {ticket.messages?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('internal_notes')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'internal_notes'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span>Internal Team Notes (INC-0304)</span>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
            {ticket.internalNotes?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit_trail'
              ? 'border-slate-800 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Audit Trail (INC-0318)</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
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
                  No public messages have been sent to the customer yet. Type below to send the first response.
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
                      <span className="font-semibold text-slate-700">{m.senderName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {m.senderType}
                      </span>
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-xs max-w-lg leading-relaxed shadow-2xs whitespace-pre-wrap ${
                        m.senderType === 'AGENT'
                          ? 'bg-sky-600 text-white rounded-tr-xs'
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
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                  <span>Reply to Customer (Public)</span>
                  <span className="text-[11px] text-slate-400">
                    Signing as <strong>{currentAgent?.name}</strong>
                  </span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your response to the customer..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Transition status to:</span>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="bg-slate-100 border border-slate-300 rounded-md px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    <option value="WAITING_ON_CUSTOMER">Waiting on Customer (Pause SLA)</option>
                    <option value="IN_PROGRESS">Keep In Progress</option>
                    <option value="RESOLVED">Mark as Resolved</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReply ? 'Sending...' : 'Send Customer Reply'}
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

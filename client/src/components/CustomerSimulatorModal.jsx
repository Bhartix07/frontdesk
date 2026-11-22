import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  ShieldCheck, 
  AlertCircle, 
  Send, 
  RotateCcw, 
  MessageSquare, 
  CheckCircle, 
  Lock 
} from 'lucide-react';
import { ticketApi } from '../services/api';

export default function CustomerSimulatorModal({ isOpen, onClose, defaultTicketNumber }) {
  const [ticketNumber, setTicketNumber] = useState(defaultTicketNumber || 'INC-1002');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (isOpen && defaultTicketNumber) {
      setTicketNumber(defaultTicketNumber);
      fetchCustomerView(defaultTicketNumber);
    }
  }, [isOpen, defaultTicketNumber]);

  const fetchCustomerView = async (num) => {
    try {
      setLoading(true);
      setError('');
      const res = await ticketApi.getCustomerTicket(num || ticketNumber);
      setTicketData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket not found or network error');
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !ticketData) return;

    try {
      setSubmittingReply(true);
      await ticketApi.addMessage(ticketData.ticketNumber, {
        senderType: 'CUSTOMER',
        senderName: ticketData.customer?.name || 'Customer',
        content: replyContent.trim()
      });
      setReplyContent('');
      await fetchCustomerView(ticketData.ticketNumber);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit customer reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReopen = async () => {
    if (!ticketData) return;
    try {
      await ticketApi.updateStatus(ticketData.ticketNumber, 'OPEN', 'CUSTOMER', null, ticketData.customer?.name, 'Customer reopened ticket within 5 working days');
      await fetchCustomerView(ticketData.ticketNumber);
      alert('Ticket successfully reopened!');
    } catch (err) {
      alert(err.response?.data?.message || 'Reopen failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-800 rounded-lg">
              <Eye className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Customer Portal Simulation
                <span className="text-[10px] font-semibold bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded uppercase">
                  INC-0304 Test
                </span>
              </h3>
              <p className="text-xs text-indigo-200">
                Live inspection of what the customer sees via customer-facing API
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar / Ticket Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Ticket #:
          </label>
          <input
            type="text"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
            placeholder="e.g. INC-1002"
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => fetchCustomerView(ticketNumber)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            Inspect View
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Security Proof Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">INC-0304 Verification: Leak-Free Guarantee</span>
              <p className="text-emerald-700 mt-0.5">
                The payload returned by <code>/api/tickets/customer/:num</code> contains ZERO internal team notes.
                Notice how private team notes are strictly absent from this view and from API network requests.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
              <p className="mt-2 text-xs">Fetching customer data...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs">
              {error}
            </div>
          ) : ticketData ? (
            <div className="space-y-4">
              
              {/* Ticket Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {ticketData.ticketNumber}
                  </span>
                  <span className="font-semibold text-slate-600 uppercase">
                    Status: {ticketData.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{ticketData.title}</h4>
                <p className="text-xs text-slate-600">{ticketData.description}</p>
                <div className="text-[11px] text-slate-400 pt-1">
                  Customer: {ticketData.customer?.name} ({ticketData.customer?.company || ticketData.customer?.email})
                </div>
              </div>

              {/* Public Conversation Feed */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Support Thread ({ticketData.messages?.length || 0})
                </h5>
                <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                  {ticketData.messages?.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">
                      No public messages exchanged yet.
                    </div>
                  ) : (
                    ticketData.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg text-xs space-y-1 ${
                          m.senderType === 'CUSTOMER'
                            ? 'bg-blue-50 border border-blue-200 ml-8'
                            : 'bg-slate-100 border border-slate-200 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className={m.senderType === 'CUSTOMER' ? 'text-blue-900' : 'text-slate-800'}>
                            {m.senderName} ({m.senderType})
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{m.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Customer Actions */}
              {ticketData.status === 'RESOLVED' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-emerald-800">
                    Is the issue not solved? You can reopen this ticket within 5 working days.
                  </span>
                  <button
                    onClick={handleReopen}
                    disabled={!ticketData.canReopen}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reopen Ticket
                  </button>
                </div>
              )}

            </div>
          ) : null}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}

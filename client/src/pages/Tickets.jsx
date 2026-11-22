import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ticketApi } from '../services/api';
import TicketTable from '../components/TicketTable';
import TicketCard from '../components/TicketCard';

export default function Tickets({ currentAgent, onOpenCreateModal }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [assignedToId, setAssignedToId] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [filterView, setFilterView] = useState('ALL');

  useEffect(() => {
    loadTickets();
  }, [status, priority, assignedToId, filterView]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getTickets({
        status: status !== 'ALL' ? status : undefined,
        priority: priority !== 'ALL' ? priority : undefined,
        assignedToId: assignedToId !== 'ALL' ? assignedToId : undefined,
        search: search.trim() || undefined,
        view: filterView !== 'ALL' ? filterView : undefined
      });
      setTickets(res.data.data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTickets();
  };

  const handleClaimTicket = async (ticketId) => {
    if (!currentAgent) return;
    try {
      await ticketApi.claimTicket(ticketId, currentAgent.id);
      await loadTickets();
    } catch (err) {
      if (err.response?.status === 409) {
        alert(`🚨 INC-0291 Collision Guard: ${err.response.data.message}`);
      } else {
        alert(err.response?.data?.message || 'Failed to claim ticket');
      }
      await loadTickets();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming customer requests, SLA compliance, and team assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, or customer name/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </form>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical (2h)</option>
              <option value="MEDIUM">Medium (4.5h)</option>
              <option value="LOW">Low (1 Day)</option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-500'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-white text-sky-600 shadow-2xs' : 'text-slate-500'}`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={loadTickets}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <TicketTable
          tickets={tickets}
          loading={loading}
          onClaimTicket={handleClaimTicket}
          currentAgent={currentAgent}
          filterView={filterView}
          onSelectFilterView={(view) => setFilterView(view)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No tickets found.
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClaimTicket={handleClaimTicket}
                currentAgent={currentAgent}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
}

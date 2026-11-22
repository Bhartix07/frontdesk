import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  AlertCircle,
  Plus,
  RefreshCw,
  Ticket
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
  const [viewMode, setViewMode] = useState('table');
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b1e3b]">
            <Ticket className="w-4 h-4 text-amber-500" />
            <span>Master Register</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Central Ticket Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter and inspect scheduled tickets, passenger issues, and transit delays
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0b1e3b] text-xs font-extrabold shadow-sm transition-colors uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Issue New Ticket
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Ticket PNR (INC-XXXX), passenger name, company or issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b1e3b] focus:bg-white font-medium"
            />
          </form>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#0b1e3b]"
            >
              <option value="ALL">All Priority Classes</option>
              <option value="CRITICAL">Superfast / Critical (2h)</option>
              <option value="MEDIUM">Express / Medium (4.5h)</option>
              <option value="LOW">Passenger / Low (1 Day)</option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#0b1e3b]"
            >
              <option value="ALL">All Transit Statuses</option>
              <option value="OPEN">Departed (Open)</option>
              <option value="IN_PROGRESS">In Transit</option>
              <option value="WAITING_ON_CUSTOMER">Signal Hold (Waiting)</option>
              <option value="RESOLVED">Arrived (Resolved)</option>
              <option value="CLOSED">Archived (Closed)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-[#0b1e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Register Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-[#0b1e3b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Boarding Cards Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={loadTickets}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh Register"
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
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-amber-500 border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              No tickets found in this register query.
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

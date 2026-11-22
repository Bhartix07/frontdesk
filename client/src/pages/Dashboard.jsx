import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Inbox, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  PauseCircle, 
  UserCheck, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Ticket,
  Compass
} from 'lucide-react';
import { ticketApi } from '../services/api';
import TicketTable from '../components/TicketTable';

export default function Dashboard({ currentAgent }) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalOpen: 0,
    waitingOnCustomer: 0,
    resolvedToday: 0,
    unassigned: 0,
    breached: 0
  });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState('ALL');

  useEffect(() => {
    loadDashboardData();
  }, [filterView, currentAgent]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, ticketsRes] = await Promise.all([
        ticketApi.getMetrics(),
        ticketApi.getTickets({
          view: filterView,
          assignedToId: filterView === 'MY_TICKETS' ? currentAgent?.id : undefined
        })
      ]);
      setMetrics(metricsRes.data.data);
      setTickets(ticketsRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (ticketId) => {
    if (!currentAgent) return;
    try {
      await ticketApi.claimTicket(ticketId, currentAgent.id);
      await loadDashboardData();
    } catch (err) {
      if (err.response?.status === 409) {
        alert(`🚨 INC-0291 Collision Guard: ${err.response.data.message}`);
      } else {
        alert(err.response?.data?.message || 'Failed to claim ticket');
      }
      await loadDashboardData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Station Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0b1e3b]">
              Central Operations Board
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Railway Ticket Control & Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as Officer <strong className="text-slate-800">{currentAgent?.name}</strong> • 
            Status: <span className="text-emerald-700 font-bold">On Duty ({currentAgent?.role})</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/tickets')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0b1e3b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#132c54] shadow-sm transition-colors"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            View Master Register
          </button>
        </div>
      </div>

      {/* 5 Railway Signal Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Active Queue */}
        <div 
          onClick={() => setFilterView('ALL')}
          className={`p-4 rounded-xl border-t-4 cursor-pointer transition-all ${
            filterView === 'ALL'
              ? 'bg-blue-50/70 border-t-blue-700 border-x-blue-200 border-b-blue-200 shadow-sm ring-2 ring-blue-300'
              : 'bg-white border-t-[#0b1e3b] border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>In-Transit Queue</span>
            <Ticket className="w-4 h-4 text-[#0b1e3b]" />
          </div>
          <div className="text-3xl font-black text-[#0b1e3b] mt-2">
            {metrics.totalOpen}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Active running tickets</span>
        </div>

        {/* Signal Red / Late / Breached */}
        <div 
          onClick={() => setFilterView('LATE_OR_BREACHED')}
          className={`p-4 rounded-xl border-t-4 cursor-pointer transition-all ${
            filterView === 'LATE_OR_BREACHED'
              ? 'bg-rose-50 border-t-rose-600 border-x-rose-200 border-b-rose-200 shadow-sm ring-2 ring-rose-300'
              : 'bg-white border-t-rose-600 border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-extrabold uppercase tracking-wider">
            <span>Signal Red (Late)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {metrics.breached}
          </div>
          <span className="text-[11px] text-rose-700 font-semibold mt-1 block">Exceeded SLA schedule</span>
        </div>

        {/* Signal Hold / Waiting on Customer */}
        <div 
          onClick={() => setFilterView('WAITING_ON_CUSTOMER')}
          className={`p-4 rounded-xl border-t-4 cursor-pointer transition-all ${
            filterView === 'WAITING_ON_CUSTOMER'
              ? 'bg-amber-50 border-t-amber-500 border-x-amber-200 border-b-amber-200 shadow-sm ring-2 ring-amber-300'
              : 'bg-white border-t-amber-500 border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span>Signal Hold (Wait)</span>
            <PauseCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-800 mt-2">
            {metrics.waitingOnCustomer}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">SLA timer paused</span>
        </div>

        {/* Unassigned Platform Pool */}
        <div 
          onClick={() => setFilterView('UNASSIGNED')}
          className={`p-4 rounded-xl border-t-4 cursor-pointer transition-all ${
            filterView === 'UNASSIGNED'
              ? 'bg-indigo-50 border-t-indigo-600 border-x-indigo-200 border-b-indigo-200 shadow-sm ring-2 ring-indigo-300'
              : 'bg-white border-t-indigo-600 border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-900 text-xs font-bold uppercase tracking-wider">
            <span>Unassigned Pool</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-700 mt-2">
            {metrics.unassigned}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Ready for officer claim</span>
        </div>

        {/* Arrived / Resolved Today */}
        <div className="p-4 rounded-xl border-t-4 border-t-emerald-600 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <span>Cleared Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {metrics.resolvedToday}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Destination reached</span>
        </div>

      </div>

      {/* Main Ticket Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">
              Live Station Platform Queue
            </span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              {tickets.length} SCHEDULED
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Synced with Arvo Central Server
          </span>
        </div>

        <TicketTable
          tickets={tickets}
          loading={loading}
          onClaimTicket={handleClaimTicket}
          currentAgent={currentAgent}
          filterView={filterView}
          onSelectFilterView={(view) => setFilterView(view)}
        />
      </div>

    </div>
  );
}

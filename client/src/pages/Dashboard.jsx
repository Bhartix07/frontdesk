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
  Zap
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
      
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Support Agent Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arvo Systems Frontdesk • Signed in as <strong className="text-slate-800">{currentAgent?.name}</strong> ({currentAgent?.role})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tickets')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Inbox className="w-4 h-4 text-slate-500" />
            View All Tickets
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards - Solves Meera's need: "They need to know which ones are already late, and which ones are waiting on the customer" */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Active Open */}
        <div 
          onClick={() => setFilterView('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterView === 'ALL'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Open</span>
            <Inbox className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.totalOpen}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">In queue & in progress</span>
        </div>

        {/* Breached / Late */}
        <div 
          onClick={() => setFilterView('LATE_OR_BREACHED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterView === 'LATE_OR_BREACHED'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span className="font-bold">Late / Breached</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {metrics.breached}
          </div>
          <span className="text-[11px] text-rose-500 mt-1 block">Exceeded working-hr SLA</span>
        </div>

        {/* Waiting on Customer */}
        <div 
          onClick={() => setFilterView('WAITING_ON_CUSTOMER')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterView === 'WAITING_ON_CUSTOMER'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>Waiting on Customer</span>
            <PauseCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2">
            {metrics.waitingOnCustomer}
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block">SLA timer paused</span>
        </div>

        {/* Unassigned Pool */}
        <div 
          onClick={() => setFilterView('UNASSIGNED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterView === 'UNASSIGNED'
              ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 text-xs font-medium">
            <span>Unassigned Pool</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">
            {metrics.unassigned}
          </div>
          <span className="text-[11px] text-indigo-500 mt-1 block">Ready for agents to take</span>
        </div>

        {/* Resolved Today */}
        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Resolved Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {metrics.resolvedToday}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Closed within target SLA</span>
        </div>

      </div>

      {/* Main Ticket Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            Active Ticket Queue
          </h2>
          <span className="text-xs text-slate-500">
            Showing {tickets.length} tickets • Real-time working hours sync
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

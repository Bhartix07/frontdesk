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
  Compass,
  Train
} from 'lucide-react';
import { ticketApi } from '../services/api';
import TicketTable from '../components/TicketTable';
import { TrainLocomotiveIcon, OfficerAvatar } from '../components/TrainGraphics';

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
      
      {/* High-Speed Rail Hero Operations Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#07172f] via-[#0b2447] to-[#12396e] text-white p-6 sm:p-8 shadow-xl border-2 border-amber-500/40">
        
        {/* Subtle Background Train Track Grid Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-end pr-8">
          <TrainLocomotiveIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 font-mono">
                CENTRAL RAILWAY NETWORK • DISPATCH & SUPPORT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Railway Ticket Control & Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Real-time monitoring of customer requests, working-hours SLA compliance (09:30–18:30 IST), and collision-safe ticket resolution across all 9 support officers.
            </p>
          </div>

          {/* Officer On Duty Quick Badge */}
          <div className="flex items-center gap-3.5 bg-black/40 backdrop-blur-md p-3.5 rounded-xl border border-white/15 shadow-inner">
            <OfficerAvatar name={currentAgent?.name || 'Meera'} role={currentAgent?.role} size="lg" />
            <div>
              <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider font-mono">
                Officer In-Charge
              </div>
              <div className="text-sm font-extrabold text-white">
                {currentAgent?.name}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Station Duty
              </div>
            </div>
          </div>
        </div>

        {/* Train Running Route Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
              Vande Bharat SLA Engine
            </span>
            <span>Operating Window: 09:30 – 18:30 (Mon–Fri)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Auto-Rollover: Weekends & Holidays
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Timer Paused: Customer Wait
            </span>
          </div>
        </div>
      </div>

      {/* 5 Railway Signal Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Active Queue */}
        <div 
          onClick={() => setFilterView('ALL')}
          className={`p-4 rounded-xl border-t-4 cursor-pointer transition-all ${
            filterView === 'ALL'
              ? 'bg-blue-50/80 border-t-blue-700 border-x-blue-200 border-b-blue-200 shadow-sm ring-2 ring-blue-300'
              : 'bg-white border-t-[#0b1e3b] border-slate-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-extrabold uppercase tracking-wider">
            <span>In-Transit Queue</span>
            <Ticket className="w-4 h-4 text-[#0b1e3b]" />
          </div>
          <div className="text-3xl font-black text-[#0b1e3b] mt-2 font-mono">
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
          <div className="flex items-center justify-between text-rose-800 text-xs font-black uppercase tracking-wider">
            <span>Signal Red (Late)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2 font-mono">
            {metrics.breached}
          </div>
          <span className="text-[11px] text-rose-700 font-bold mt-1 block">Exceeded SLA schedule</span>
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
          <div className="flex items-center justify-between text-amber-900 text-xs font-extrabold uppercase tracking-wider">
            <span>Signal Hold (Wait)</span>
            <PauseCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-800 mt-2 font-mono">
            {metrics.waitingOnCustomer}
          </div>
          <span className="text-[11px] text-amber-700 font-bold mt-1 block">SLA timer paused</span>
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
          <div className="flex items-center justify-between text-indigo-900 text-xs font-extrabold uppercase tracking-wider">
            <span>Unassigned Pool</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-700 mt-2 font-mono">
            {metrics.unassigned}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Ready for officer claim</span>
        </div>

        {/* Arrived / Resolved Today */}
        <div className="p-4 rounded-xl border-t-4 border-t-emerald-600 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-extrabold uppercase tracking-wider">
            <span>Cleared Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">
            {metrics.resolvedToday}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Destination reached</span>
        </div>

      </div>

      {/* Main Ticket Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#0b1e3b] uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Train className="w-4 h-4 text-amber-600" />
              Live Station Platform Queue
            </span>
            <span className="bg-[#0b1e3b] text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono shadow-2xs">
              {tickets.length} SCHEDULED
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">
            Central Railway Signaling Active
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

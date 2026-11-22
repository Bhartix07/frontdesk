import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Inbox, 
  LayoutDashboard, 
  Plus, 
  Eye, 
  Clock, 
  ShieldCheck, 
  User, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Navbar({ 
  agents = [], 
  currentAgent, 
  onSelectAgent, 
  onOpenCreateModal, 
  onOpenCustomerSimulator,
  onTriggerSweep
}) {
  const location = useLocation();

  // Check if current real-time is in working hours (9:30 AM to 6:30 PM, Mon-Fri)
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeVal = hours * 60 + minutes;
  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHours = isWeekday && currentTimeVal >= (9 * 60 + 30) && currentTimeVal < (18 * 60 + 30);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg tracking-tight">Frontdesk</span>
                <span className="text-[10px] block font-semibold text-sky-600 uppercase tracking-wider">
                  Arvo Systems
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/tickets"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/tickets')
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Tickets
              </Link>
            </nav>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            
            {/* Live Working Hours Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600" title="Business hours: Mon-Fri 09:30 - 18:30 IST. SLA timers pause outside this window.">
              <span className={`w-2 h-2 rounded-full ${isWorkingHours ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px]">
                {isWorkingHours ? 'Working Hours Active' : 'Off-Hours (SLA Paused)'}
              </span>
            </div>

            {/* Sweep Auto-close trigger */}
            <button
              onClick={onTriggerSweep}
              title="Run 5-day inactive customer auto-close sweep"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Auto-Close Sweep</span>
            </button>

            {/* Customer Simulator Button - INC-0304 Verifier */}
            <button
              onClick={onOpenCustomerSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors shadow-2xs"
              title="Verify that customer view never sees internal notes (INC-0304 test)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verify</span> Customer View
            </button>

            {/* New Ticket Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>

            {/* Agent Switcher Dropdown (9 Arvo Support Agents) */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {currentAgent?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <select
                  value={currentAgent?.id || ''}
                  onChange={(e) => {
                    const selected = agents.find(a => a.id === e.target.value);
                    if (selected) onSelectAgent(selected);
                  }}
                  className="text-xs font-semibold bg-transparent border-0 text-slate-800 focus:ring-0 cursor-pointer p-0 pr-4"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.role === 'SUPPORT_LEAD' ? '(Lead)' : ''}
                    </option>
                  ))}
                </select>
                <span className="block text-[10px] text-slate-400 font-medium">
                  {currentAgent?.role || 'Support Agent'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}

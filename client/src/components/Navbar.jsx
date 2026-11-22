import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  Eye, 
  RefreshCw,
  Ticket,
  ChevronDown
} from 'lucide-react';
import { TrainLocomotiveIcon, OfficerAvatar } from './TrainGraphics';

export default function Navbar({ 
  agents = [], 
  currentAgent, 
  onSelectAgent, 
  onOpenCreateModal, 
  onOpenCustomerSimulator,
  onTriggerSweep
}) {
  const location = useLocation();

  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeVal = hours * 60 + minutes;
  const isWeekday = day >= 1 && day <= 5;
  const isWorkingHours = isWeekday && currentTimeVal >= (9 * 60 + 30) && currentTimeVal < (18 * 60 + 30);

  return (
    <header className="bg-[#07172f] text-white border-b-2 border-amber-500/80 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-[#0b1e3b] shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform p-1">
                <TrainLocomotiveIcon className="w-8 h-8" color="#f59e0b" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-lg tracking-wider uppercase font-sans">
                    Frontdesk
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-widest">
                    Central
                  </span>
                </div>
                <span className="text-[11px] block font-semibold text-slate-300 tracking-wide">
                  Indian Railways Operations • Arvo Systems
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  location.pathname === '/'
                    ? 'bg-white/15 text-amber-300 border-b-2 border-amber-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Operations Board
              </Link>
              <Link
                to="/tickets"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  location.pathname.startsWith('/tickets')
                    ? 'bg-white/15 text-amber-300 border-b-2 border-amber-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Ticket className="w-4 h-4" />
                Ticket Register
              </Link>
            </nav>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            
            {/* Railway Signal Pill */}
            <div 
              className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border bg-black/30 border-white/15 text-slate-200"
              title="Operational Hours: Mon-Fri 09:30 - 18:30 IST. SLA timers paused outside working hours."
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isWorkingHours ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
              <span className="text-[11px] font-mono tracking-tight font-bold">
                {isWorkingHours ? 'Signal Green (09:30-18:30)' : 'Signal Hold (Off-Hours)'}
              </span>
            </div>

            {/* Sweep Auto-close trigger */}
            <button
              onClick={onTriggerSweep}
              title="Run 5-day inactive customer auto-close sweep"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white hover:bg-white/15 text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Sweep</span>
            </button>

            {/* Customer Simulator Button */}
            <button
              onClick={onOpenCustomerSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold tracking-wide transition-colors"
              title="Verify Passenger View (INC-0304 Private Note Isolation)"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Passenger View</span>
            </button>

            {/* New Ticket Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0b1e3b] text-xs font-black shadow-md transition-colors uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Ticket</span>
            </button>

            {/* Support Officer Profile Switcher with Real Avatar Photo */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/20">
              <OfficerAvatar name={currentAgent?.name || 'Meera'} role={currentAgent?.role} size="md" />
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1">
                  <select
                    value={currentAgent?.id || ''}
                    onChange={(e) => {
                      const selected = agents.find(a => a.id === e.target.value);
                      if (selected) onSelectAgent(selected);
                    }}
                    className="text-xs font-bold bg-transparent border-0 text-white focus:ring-0 cursor-pointer p-0 pr-4"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id} className="text-slate-900 bg-white">
                        {agent.name} {agent.role === 'SUPPORT_LEAD' ? '(Station Lead)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="block text-[10px] text-amber-300 font-semibold font-mono">
                  {currentAgent?.role === 'SUPPORT_LEAD' ? '⭐ Station Lead Officer' : 'Support Officer'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}

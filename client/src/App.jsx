import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';
import CreateTicketModal from './components/CreateTicketModal';
import CustomerSimulatorModal from './components/CustomerSimulatorModal';
import { agentApi, ticketApi } from './services/api';

export default function App() {
  const [agents, setAgents] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerModalState, setCustomerModalState] = useState({
    isOpen: false,
    ticketNumber: 'INC-1002'
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const res = await agentApi.getAgents();
      const loaded = res.data.data;
      setAgents(loaded);

      // Restore stored agent or pick Meera (Lead) as default
      const saved = localStorage.getItem('frontdesk_active_agent');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = loaded.find(a => a.id === parsed.id);
          if (found) {
            setCurrentAgent(found);
            return;
          }
        } catch (e) {}
      }

      if (loaded.length > 0) {
        const lead = loaded.find(a => a.role === 'SUPPORT_LEAD') || loaded[0];
        setCurrentAgent(lead);
        localStorage.setItem('frontdesk_active_agent', JSON.stringify(lead));
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  const handleSelectAgent = (agent) => {
    setCurrentAgent(agent);
    localStorage.setItem('frontdesk_active_agent', JSON.stringify(agent));
  };

  const handleTriggerSweep = async () => {
    try {
      const res = await ticketApi.triggerSweep();
      const count = res.data.closedTickets?.length || 0;
      alert(`Auto-close sweep finished! Closed ${count} tickets inactive for > 5 working days.`);
      window.location.reload();
    } catch (err) {
      alert('Sweep failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        
        {/* Navigation Bar */}
        <Navbar
          agents={agents}
          currentAgent={currentAgent}
          onSelectAgent={handleSelectAgent}
          onOpenCreateModal={() => setIsCreateOpen(true)}
          onOpenCustomerSimulator={(num) =>
            setCustomerModalState({
              isOpen: true,
              ticketNumber: typeof num === 'string' ? num : 'INC-1002'
            })
          }
          onTriggerSweep={handleTriggerSweep}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard currentAgent={currentAgent} />} />
            <Route
              path="/tickets"
              element={
                <Tickets
                  currentAgent={currentAgent}
                  onOpenCreateModal={() => setIsCreateOpen(true)}
                />
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <TicketDetails
                  currentAgent={currentAgent}
                  onOpenCustomerSimulator={(num) =>
                    setCustomerModalState({ isOpen: true, ticketNumber: num })
                  }
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Modals */}
        <CreateTicketModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            window.location.reload();
          }}
        />

        <CustomerSimulatorModal
          isOpen={customerModalState.isOpen}
          defaultTicketNumber={customerModalState.ticketNumber}
          onClose={() => setCustomerModalState({ isOpen: false, ticketNumber: '' })}
        />

      </div>
    </BrowserRouter>
  );
}

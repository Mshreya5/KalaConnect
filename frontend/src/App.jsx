import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Activities from './pages/Activities';
import MySkills from './pages/MySkills';
import Availability from './pages/Availability';
import TalentSearch from './pages/TalentSearch';

import EventsManager from './components/EventsManager';
import TalentMatcher from './components/TalentMatcher';
import ParticipationManager from './components/ParticipationManager';
import ReportsView from './components/ReportsView';

function EventsRoute({ selectedEventId, setSelectedEventId }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <EventsManager
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
        setActiveTab={(tab) => {
          if (tab === 'matcher') navigate('/talent-matcher');
          else if (tab === 'participation') navigate('/participation');
          else if (tab === 'reports') navigate('/reports');
          else if (tab === 'dashboard') navigate('/');
        }}
      />
    </div>
  );
}

function TalentMatcherRoute({ selectedEventId, setSelectedEventId }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <TalentMatcher
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
      />
    </div>
  );
}

function ParticipationRoute({ selectedEventId, setSelectedEventId }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ParticipationManager
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
      />
    </div>
  );
}

function ReportsRoute({ selectedEventId, setSelectedEventId }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ReportsView
        setSelectedEventId={setSelectedEventId}
        setActiveTab={(tab) => {
          if (tab === 'events') navigate('/events');
          else if (tab === 'matcher') navigate('/talent-matcher');
          else if (tab === 'dashboard') navigate('/');
        }}
      />
    </div>
  );
}

export default function App() {
  const [selectedEventId, setSelectedEventId] = useState(null);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
          <Navbar />

          <main className="flex-1 pb-12">
            <Routes>
              {/* Home / Role-Aware Dashboard */}
              <Route path="/" element={<Dashboard setSelectedEventId={setSelectedEventId} />} />

              {/* Profile & Talent Management */}
              <Route path="/profile" element={<Participants />} />
              <Route path="/participants" element={<Participants />} />
              <Route path="/skills" element={<MySkills />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/search" element={<TalentSearch />} />

              {/* Events & Coordination */}
              <Route 
                path="/events" 
                element={<EventsRoute selectedEventId={selectedEventId} setSelectedEventId={setSelectedEventId} />} 
              />
              <Route 
                path="/talent-matcher" 
                element={<TalentMatcherRoute selectedEventId={selectedEventId} setSelectedEventId={setSelectedEventId} />} 
              />
              <Route 
                path="/participation" 
                element={<ParticipationRoute selectedEventId={selectedEventId} setSelectedEventId={setSelectedEventId} />} 
              />
              <Route 
                path="/reports" 
                element={<ReportsRoute selectedEventId={selectedEventId} setSelectedEventId={setSelectedEventId} />} 
              />
            </Routes>
          </main>

          {/* Clean, Professional Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-4 space-y-1">
              <p className="font-semibold text-slate-700">
                KalaConnect — Cultural Talent, Availability & Event Coordination Platform
              </p>
              <p className="text-slate-400">
                Connecting campus performers with cultural events, rehearsals, and showcases.
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

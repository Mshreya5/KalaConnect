import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import EventsManager from './components/EventsManager';
import TalentMatcher from './components/TalentMatcher';
import ParticipationManager from './components/ParticipationManager';
import ReportsView from './components/ReportsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState(null);

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedEventId={setSelectedEventId} 
          />
        )}

        {activeTab === 'events' && (
          <EventsManager 
            selectedEventId={selectedEventId} 
            setSelectedEventId={setSelectedEventId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'matcher' && (
          <TalentMatcher 
            selectedEventId={selectedEventId} 
            setSelectedEventId={setSelectedEventId} 
          />
        )}

        {activeTab === 'participation' && (
          <ParticipationManager 
            selectedEventId={selectedEventId} 
            setSelectedEventId={setSelectedEventId} 
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView 
            setActiveTab={setActiveTab} 
            setSelectedEventId={setSelectedEventId} 
          />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: '#ffffff', padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>
          <strong>KalaConnect</strong> — Cultural Talent, Availability & Event Coordination System | College DBMS Mini-Project
        </p>
        <p style={{ marginTop: '0.25rem', color: 'var(--text-light)' }}>
          Member 2 Scope: Organizer & Event Management, Skill Requirements, Stored Procedures, and Participation Coordination | Built with React, Vite, Node.js, Express & MySQL Community Server 8.0
        </p>
      </footer>
    </div>
  );
}

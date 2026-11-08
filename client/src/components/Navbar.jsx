import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Award, 
  BarChart3, 
  UserCheck 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events & Requirements', icon: CalendarDays },
    { id: 'matcher', label: 'Talent Matcher', icon: Sparkles },
    { id: 'participation', label: 'Registrations & Roster', icon: UserCheck },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          <div className="brand-text">
            <h1>KalaConnect</h1>
            <p>Cultural Talent & Event Coordination</p>
          </div>
        </div>

        <div className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="member-badge">
          <Award size={14} />
          <span>Member 2: Events & Coordination</span>
        </div>
      </div>
    </nav>
  );
}

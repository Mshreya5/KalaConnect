import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Building2, 
  ArrowRight,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ setActiveTab, setSelectedEventId }) {
  const [stats, setStats] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [deficits, setDeficits] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Organizer Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrg, setNewOrg] = useState({
    full_name: '',
    email: '',
    phone: '',
    club_or_dept: '',
    designation: 'Coordinator'
  });
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, orgsRes, defRes, upEventsRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: {} })),
        api.getOrganizers().catch(() => ({ data: [] })),
        api.getDeficitReport().catch(() => ({ data: [] })),
        api.getUpcomingEvents().catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data || {});
      setOrganizers(orgsRes.data || []);
      setDeficits(defRes.data || []);
      setUpcomingEvents(upEventsRes.data || []);
    } catch (err) {
      setError('Failed to connect to backend server. Ensure backend is running and MySQL is connected.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrganizer(e) {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      await api.createOrganizer(newOrg);
      setShowAddModal(false);
      setNewOrg({
        full_name: '',
        email: '',
        phone: '',
        club_or_dept: '',
        designation: 'Coordinator'
      });
      loadDashboardData();
    } catch (err) {
      setModalError(err.message || 'Failed to create organizer');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Top Banner */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem' }}>Organizer & Event Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Coordinate college cultural events, monitor talent fulfillment deficits, and deploy matching performers.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Add New Organizer</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Calendar size={26} />
          </div>
          <div className="stat-info">
            <h4>Scheduled Events</h4>
            <div className="stat-value">{stats?.upcoming_events ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
            <Building2 size={26} />
          </div>
          <div className="stat-info">
            <h4>Active Organizers</h4>
            <div className="stat-value">{stats?.total_organizers ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Users size={26} />
          </div>
          <div className="stat-info">
            <h4>Total Registrations</h4>
            <div className="stat-value">{stats?.total_registrations ?? 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertCircle size={26} />
          </div>
          <div className="stat-info">
            <h4>Unfilled Skill Slots</h4>
            <div className="stat-value">{deficits.length}</div>
          </div>
        </div>
      </div>

      {/* Deficit Alert Notice */}
      {deficits.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ef4444' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: '#b91c1c' }}>
              <AlertCircle size={20} />
              <span>Event Requirements Deficit Alert ({deficits.length} open slots require artists)</span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('reports')}
            >
              <span>View Full Deficit Analysis</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Organizer / Club</th>
                  <th>Missing Skill</th>
                  <th>Needed / Confirmed</th>
                  <th>Deficit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deficits.slice(0, 4).map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{d.event_name}</td>
                    <td>{d.event_date}</td>
                    <td>{d.organizer_name} ({d.club_or_dept})</td>
                    <td><span className="badge badge-nodeclared">{d.required_skill}</span></td>
                    <td>{d.target_headcount} requested / {d.confirmed_headcount} confirmed</td>
                    <td>
                      <span className="badge badge-cancelled" style={{ fontSize: '0.82rem' }}>
                        -{d.deficit_headcount} slots
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedEventId(d.event_id);
                          setActiveTab('matcher');
                        }}
                      >
                        <Sparkles size={14} />
                        <span>Match Artists</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Grid: Organizers & Upcoming Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Organizers List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={20} style={{ color: 'var(--primary)' }} />
              <span>Coordinators & Organizers</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {organizers.length} Registered Leads
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {organizers.map((org) => (
              <div 
                key={org.organizer_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.9rem 1rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{org.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {org.designation} • {org.club_or_dept}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={12} /> {org.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={12} /> {org.phone}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-scheduled" style={{ marginBottom: '0.3rem' }}>
                    {org.total_events || 0} Events Hosted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events Roster */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={20} style={{ color: 'var(--primary)' }} />
              <span>Upcoming Cultural Events</span>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('events')}
            >
              <span>Manage Events</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {upcomingEvents.slice(0, 5).map((ev) => (
              <div 
                key={ev.event_id}
                style={{
                  padding: '1rem',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{ev.event_name}</div>
                  <span className={`badge badge-${(ev.status || 'Scheduled').toLowerCase()}`}>
                    {ev.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  📅 {ev.event_date} ({ev.start_time?.slice(0, 5)} - {ev.end_time?.slice(0, 5)}) • 📍 {ev.venue}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>
                    Host: <strong>{ev.organizer_name}</strong> ({ev.organizing_body})
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedEventId(ev.event_id);
                      setActiveTab('events');
                    }}
                  >
                    Details & Requirements
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Organizer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register New Event Coordinator</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {modalError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrganizer}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input"
                  required
                  placeholder="e.g., Prof. Rajesh Kumar or Ananya Rao"
                  value={newOrg.full_name}
                  onChange={(e) => setNewOrg({ ...newOrg, full_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input"
                    required
                    placeholder="coordinator@college.edu"
                    value={newOrg.email}
                    onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="tel" 
                    className="form-input"
                    required
                    placeholder="9876543210"
                    value={newOrg.phone}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Club / Department *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    required
                    placeholder="e.g., Dhvani Music Club, Cultural Team"
                    value={newOrg.club_or_dept}
                    onChange={(e) => setNewOrg({ ...newOrg, club_or_dept: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g., Faculty Lead, Student President"
                    value={newOrg.designation}
                    onChange={(e) => setNewOrg({ ...newOrg, designation: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Calendar,
  Filter,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export default function ParticipationManager({ selectedEventId, setSelectedEventId }) {
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(selectedEventId || '');
  const [participants, setParticipants] = useState([]);
  const [studentDirectory, setStudentDirectory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('');

  // Register Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [newReg, setNewReg] = useState({
    participant_id: '',
    role: 'Performer'
  });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regModalError, setRegModalError] = useState(null);

  useEffect(() => {
    loadEvents();
    loadStudentDirectory();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setCurrentEventId(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (currentEventId) {
      loadEventParticipants(currentEventId);
    } else {
      setParticipants([]);
    }
  }, [currentEventId]);

  async function loadEvents() {
    try {
      const res = await api.getEvents();
      const evs = res.data || [];
      setEvents(evs);
      if (!currentEventId && evs.length > 0) {
        setCurrentEventId(evs[0].event_id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }

  async function loadStudentDirectory() {
    try {
      const res = await api.getParticipants();
      setStudentDirectory(res.data || []);
      if (res.data?.length > 0) {
        setNewReg(prev => ({ ...prev, participant_id: res.data[0].participant_id }));
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }

  async function loadEventParticipants(id) {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEventParticipants(id);
      setParticipants(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load participants roster');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(participationId, newStatus) {
    setError(null);
    setSuccessMsg(null);
    try {
      await api.updateParticipationStatus(participationId, { status: newStatus });
      setSuccessMsg(`Status updated to '${newStatus}' successfully!`);
      loadEventParticipants(currentEventId);
    } catch (err) {
      setError(`Cannot update status: ${err.message}`);
    }
  }

  async function handleDeleteParticipation(id) {
    if (!window.confirm('Are you sure you want to remove this registration?')) return;
    try {
      await api.deleteParticipation(id);
      setSuccessMsg('Registration removed successfully.');
      loadEventParticipants(currentEventId);
    } catch (err) {
      setError(`Failed to remove: ${err.message}`);
    }
  }

  async function handleRegisterParticipant(e) {
    e.preventDefault();
    setSubmittingReg(true);
    setRegModalError(null);
    try {
      await api.registerParticipant(currentEventId, newReg);
      setShowRegModal(false);
      setSuccessMsg('Student successfully registered for event!');
      loadEventParticipants(currentEventId);
    } catch (err) {
      setRegModalError(err.message || 'Registration failed');
    } finally {
      setSubmittingReg(false);
    }
  }

  const selectedEvent = events.find(e => String(e.event_id) === String(currentEventId));

  const filteredList = participants.filter(p => {
    if (!statusFilter) return true;
    return p.participation_status === statusFilter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck color="var(--primary)" />
            <span>Event Registrations & Roster Management</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track student applications, shortlist performers, and approve confirmed participants.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          disabled={!currentEventId}
          onClick={() => setShowRegModal(true)}
        >
          <Plus size={16} />
          <span>Manual Student Registration</span>
        </button>
      </div>

      {/* Event Selector & Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label">Select Event</label>
            <select 
              className="form-select"
              value={currentEventId}
              onChange={(e) => {
                setCurrentEventId(e.target.value);
                setSelectedEventId?.(e.target.value);
              }}
            >
              {events.map(ev => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.event_name} ({ev.event_date})
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <label className="form-label">Filter by Status</label>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses ({participants.length})</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Registered">Registered</option>
              <option value="Attended">Attended</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {selectedEvent && (
          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <span>📅 <strong>Date:</strong> {selectedEvent.event_date}</span>
            <span>⏰ <strong>Timing:</strong> {selectedEvent.start_time?.slice(0, 5)} - {selectedEvent.end_time?.slice(0, 5)}</span>
            <span>📍 <strong>Venue:</strong> {selectedEvent.venue}</span>
            <span>👥 <strong>Host:</strong> {selectedEvent.organizer_name} ({selectedEvent.club_or_dept})</span>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Participants Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>
            Registered Students ({filteredList.length})
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing records sorted by status priority
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="empty-state">
            <Users size={42} />
            <h3>No Registrations Found</h3>
            <p>No students have registered for this event with the selected filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Department & Roll</th>
                  <th>Assigned Role</th>
                  <th>Current Status</th>
                  <th>Status Transition Action</th>
                  <th>Score / Remarks</th>
                  <th>Registered At</th>
                  <th style={{ textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((ptn) => (
                  <tr key={ptn.participation_id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{ptn.participant_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {ptn.participant_email} • {ptn.participant_phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ptn.department}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {ptn.usn_or_roll} (Year {ptn.year_of_study})
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-nodeclared" style={{ fontWeight: 600 }}>
                        {ptn.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${(ptn.participation_status || 'registered').toLowerCase()}`}>
                        {ptn.participation_status}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-select"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                        value={ptn.participation_status}
                        onChange={(e) => handleStatusChange(ptn.participation_id, e.target.value)}
                      >
                        <option value="Registered">Registered</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Attended">Attended</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {ptn.feedback_or_score || '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                      {ptn.registered_at?.slice(0, 10)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#dc2626' }}
                        title="Remove registration"
                        onClick={() => handleDeleteParticipation(ptn.participation_id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Registration Modal */}
      {showRegModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register Participant for Event</h3>
              <button className="close-btn" onClick={() => setShowRegModal(false)}>✕</button>
            </div>

            {regModalError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{regModalError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterParticipant}>
              <div className="form-group">
                <label className="form-label">Event</label>
                <input 
                  type="text" 
                  className="form-input" 
                  disabled 
                  value={selectedEvent?.event_name || ''} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Student *</label>
                <select 
                  className="form-select"
                  required
                  value={newReg.participant_id}
                  onChange={(e) => setNewReg({ ...newReg, participant_id: e.target.value })}
                >
                  <option value="">Select Student</option>
                  {studentDirectory.map(s => (
                    <option key={s.participant_id} value={s.participant_id}>
                      {s.full_name} ({s.college_id} - {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Performance Role</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g., Lead Vocalist, Tabla Accompanist, Solo Dancer"
                  value={newReg.role}
                  onChange={(e) => setNewReg({ ...newReg, role: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingReg}>
                  {submittingReg ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

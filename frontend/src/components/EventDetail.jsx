import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Trash2, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  Edit
} from 'lucide-react';
import { api } from '../services/api';

export default function EventDetail({ eventId, onBack, setActiveTab, onEdit }) {
  const [eventData, setEventData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Requirement modal
  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [newReq, setNewReq] = useState({
    skill_id: '',
    required_count: 2,
    notes: ''
  });
  const [reqModalError, setReqModalError] = useState(null);
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    loadEventDetails();
    loadSkills();
  }, [eventId]);

  async function loadEventDetails() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEvent(eventId);
      setEventData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }

  async function loadSkills() {
    try {
      const res = await api.getSkills();
      setSkills(res.data || []);
      if (res.data?.length > 0) {
        setNewReq(prev => ({ ...prev, skill_id: res.data[0].skill_id }));
      }
    } catch (err) {
      console.error('Failed to load skills list:', err);
    }
  }

  async function handleAddRequirement(e) {
    e.preventDefault();
    setSubmittingReq(true);
    setReqModalError(null);
    try {
      await api.addEventRequirement(eventId, newReq);
      setShowAddReqModal(false);
      setNewReq({ skill_id: skills[0]?.skill_id || '', required_count: 2, notes: '' });
      loadEventDetails();
    } catch (err) {
      setReqModalError(err.message || 'Failed to add requirement');
    } finally {
      setSubmittingReq(false);
    }
  }

  async function handleDeleteRequirement(reqId) {
    if (!window.confirm('Are you sure you want to remove this skill requirement?')) return;
    try {
      await api.deleteEventRequirement(reqId);
      loadEventDetails();
    } catch (err) {
      alert(`Error deleting requirement: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading event information...</p>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="card alert alert-danger">
        <AlertCircle size={18} />
        <span>Event not found or failed to load.</span>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>Back to Events</button>
      </div>
    );
  }

  const requirements = eventData.requirements || [];
  const summary = eventData.participation_summary || {};
  const totalRequired = requirements.reduce((acc, r) => acc + (r.required_count || 0), 0);
  const totalConfirmed = requirements.reduce((acc, r) => acc + (r.confirmed_count || 0), 0);
  const totalDeficit = requirements.reduce((acc, r) => acc + (r.deficit || 0), 0);

  return (
    <div>
      {/* Navigation bar back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to All Events</span>
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            <Edit size={14} />
            <span>Edit Event</span>
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('matcher')}
          >
            <Sparkles size={14} />
            <span>Launch Talent Matcher</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Event Header Banner */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className={`badge badge-${(eventData.status || 'Scheduled').toLowerCase()}`}>
                {eventData.status}
              </span>
              <span className="badge badge-nodeclared">
                Theme: {eventData.cultural_theme || 'Cultural Arts'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>{eventData.event_name}</h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} color="var(--primary)" /> {eventData.event_date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} color="var(--primary)" /> {eventData.start_time?.slice(0, 5)} - {eventData.end_time?.slice(0, 5)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={15} color="var(--primary)" /> {eventData.venue}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={15} color="var(--primary)" /> {eventData.organizer_name} ({eventData.club_or_dept})
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1rem', background: '#f1f5f9', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Confirmed</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a' }}>{summary.confirmed || 0}</div>
            </div>
            <div style={{ width: '1px', background: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Total Applicants</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5' }}>{summary.total_registrations || 0}</div>
            </div>
            <div style={{ width: '1px', background: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Open Slots</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: totalDeficit > 0 ? '#dc2626' : '#16a34a' }}>
                {totalDeficit}
              </div>
            </div>
          </div>
        </div>

        {eventData.description && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <strong>Event Description:</strong> {eventData.description}
          </div>
        )}
      </div>

      {/* Skill Requirements Section (TASK 5 & TASK 1) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Users size={20} color="var(--primary)" />
              <span>Event Skill Requirements & Headcount Fulfillment</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Specify which artistic skills and headcount targets this event requires.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddReqModal(true)}>
            <Plus size={15} />
            <span>Add Skill Requirement</span>
          </button>
        </div>

        {requirements.length === 0 ? (
          <div className="empty-state">
            <Users size={36} />
            <p>No skill requirements configured for this event yet.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => setShowAddReqModal(true)}>
              Define Skill Requirement
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Artistic Skill</th>
                  <th>Activity Domain</th>
                  <th>Target Count</th>
                  <th>Confirmed Artists</th>
                  <th>Fulfillment Progress</th>
                  <th>Deficit Status</th>
                  <th>Notes / Guidelines</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => {
                  const pct = Math.min(100, Math.round(((req.confirmed_count || 0) / (req.required_count || 1)) * 100));
                  return (
                    <tr key={req.requirement_id}>
                      <td style={{ fontWeight: 700 }}>{req.skill_name}</td>
                      <td>{req.activity_name}</td>
                      <td style={{ fontWeight: 600 }}>{req.required_count} needed</td>
                      <td style={{ fontWeight: 600, color: '#16a34a' }}>{req.confirmed_count || 0} confirmed</td>
                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar-bg" style={{ flex: 1 }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        {req.deficit > 0 ? (
                          <span className="badge badge-cancelled">
                            Deficit: -{req.deficit}
                          </span>
                        ) : (
                          <span className="badge badge-confirmed">
                            Fully Staffed
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {req.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626' }}
                          title="Remove requirement"
                          onClick={() => handleDeleteRequirement(req.requirement_id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('matcher')}
          >
            <Sparkles size={16} />
            <span>Search & Match Qualified Artists for this Event</span>
          </button>
        </div>
      </div>

      {/* Add Requirement Modal */}
      {showAddReqModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Skill Requirement to Event</h3>
              <button className="close-btn" onClick={() => setShowAddReqModal(false)}>✕</button>
            </div>

            {reqModalError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{reqModalError}</span>
              </div>
            )}

            <form onSubmit={handleAddRequirement}>
              <div className="form-group">
                <label className="form-label">Required Cultural Skill *</label>
                <select 
                  className="form-select"
                  required
                  value={newReq.skill_id}
                  onChange={(e) => setNewReq({ ...newReq, skill_id: e.target.value })}
                >
                  <option value="">Select Skill</option>
                  {skills.map(s => (
                    <option key={s.skill_id} value={s.skill_id}>
                      {s.skill_name} ({s.activity_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Number of Artists Needed *</label>
                <input 
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  required
                  value={newReq.required_count}
                  onChange={(e) => setNewReq({ ...newReq, required_count: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Requirement Notes / Specific Role Guidelines</label>
                <textarea 
                  className="form-textarea"
                  rows="2"
                  placeholder="e.g., Accompanist rhythm support, solo competitive slot, high vocal projection..."
                  value={newReq.notes}
                  onChange={(e) => setNewReq({ ...newReq, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddReqModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingReq}>
                  {submittingReq ? 'Saving...' : 'Add Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

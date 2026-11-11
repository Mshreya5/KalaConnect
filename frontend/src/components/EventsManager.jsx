import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Sparkles, 
  Users, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import EventDetail from './EventDetail';

export default function EventsManager({ selectedEventId, setSelectedEventId, setActiveTab }) {
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Event modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    organizer_id: '',
    activity_id: '',
    event_name: '',
    event_date: '',
    start_time: '17:00:00',
    end_time: '20:00:00',
    venue: '',
    status: 'Scheduled',
    description: ''
  });
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEventsData();
  }, [statusFilter]);

  async function loadEventsData() {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [eventsRes, orgsRes, actsRes] = await Promise.all([
        api.getEvents(params),
        api.getOrganizers(),
        api.getCulturalActivities(),
      ]);

      setEvents(eventsRes.data || []);
      setOrganizers(orgsRes.data || []);
      setActivities(actsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setIsEditing(false);
    setCurrentEvent({
      organizer_id: organizers[0]?.organizer_id || '',
      activity_id: activities[0]?.activity_id || '',
      event_name: '',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '17:00:00',
      end_time: '20:00:00',
      venue: '',
      status: 'Scheduled',
      description: ''
    });
    setModalError(null);
    setShowModal(true);
  }

  function handleOpenEdit(ev) {
    setIsEditing(true);
    setCurrentEvent({
      event_id: ev.event_id,
      organizer_id: ev.organizer_id,
      activity_id: ev.activity_id || '',
      event_name: ev.event_name,
      event_date: ev.event_date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      venue: ev.venue,
      status: ev.status,
      description: ev.description || ''
    });
    setModalError(null);
    setShowModal(true);
  }

  async function handleSaveEvent(e) {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    if (currentEvent.end_time <= currentEvent.start_time) {
      setModalError('End time must be strictly after start time.');
      setSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        await api.updateEvent(currentEvent.event_id, currentEvent);
      } else {
        await api.createEvent(currentEvent);
      }
      setShowModal(false);
      loadEventsData();
    } catch (err) {
      setModalError(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent(id) {
    if (!window.confirm('Are you sure you want to delete this event? This will also remove its requirements.')) {
      return;
    }
    try {
      await api.deleteEvent(id);
      if (selectedEventId === id) setSelectedEventId(null);
      loadEventsData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  const filteredEvents = events.filter((ev) => {
    const term = searchTerm.toLowerCase();
    return (
      ev.event_name?.toLowerCase().includes(term) ||
      ev.venue?.toLowerCase().includes(term) ||
      ev.organizer_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* If an event is selected for viewing details/requirements */}
      {selectedEventId ? (
        <EventDetail 
          eventId={selectedEventId} 
          onBack={() => setSelectedEventId(null)}
          setActiveTab={setActiveTab}
          onEdit={() => {
            const ev = events.find(e => e.event_id === selectedEventId);
            if (ev) handleOpenEdit(ev);
          }}
        />
      ) : (
        <>
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.65rem' }}>Cultural Events Management</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Create, schedule, and configure skill requirement headcounts for campus cultural fests.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} />
              <span>Create New Event</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by event name, venue, or coordinator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {filteredEvents.map((ev) => (
              <div key={ev.event_id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-nodeclared" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                      {ev.cultural_theme || 'Cultural Arts'}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', lineHeight: '1.3' }}>{ev.event_name}</h3>
                  </div>
                  <span className={`badge badge-${(ev.status || 'Scheduled').toLowerCase()}`}>
                    {ev.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span><strong>Date:</strong> {ev.event_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="var(--primary)" />
                    <span><strong>Timing:</strong> {ev.start_time?.slice(0, 5)} - {ev.end_time?.slice(0, 5)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span><strong>Venue:</strong> {ev.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={14} color="var(--primary)" />
                    <span><strong>Host:</strong> {ev.organizer_name} ({ev.club_or_dept})</span>
                  </div>
                </div>

                {ev.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ev.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.85rem', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    👥 {ev.confirmed_participants || 0} Confirmed / {ev.total_registrations || 0} Applied
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      title="Edit event"
                      onClick={() => handleOpenEdit(ev)}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedEventId(ev.event_id)}
                    >
                      <span>Requirements</span>
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626' }}
                      title="Delete event"
                      onClick={() => handleDeleteEvent(ev.event_id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && !loading && (
            <div className="card empty-state">
              <Calendar size={48} />
              <h3>No Events Found</h3>
              <p>There are no cultural events matching your search or filter criteria.</p>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Event Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{isEditing ? 'Edit Event Details' : 'Create New Cultural Event'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {modalError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="e.g., Dhwani Classical Night 2026"
                  value={currentEvent.event_name}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, event_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Organizer / Coordinator *</label>
                  <select 
                    className="form-select"
                    required
                    value={currentEvent.organizer_id}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, organizer_id: e.target.value })}
                  >
                    <option value="">Select Coordinator</option>
                    {organizers.map(o => (
                      <option key={o.organizer_id} value={o.organizer_id}>
                        {o.full_name} ({o.club_or_dept})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cultural Activity Domain</label>
                  <select 
                    className="form-select"
                    value={currentEvent.activity_id}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, activity_id: e.target.value })}
                  >
                    <option value="">General / Multi-Disciplinary</option>
                    {activities.map(a => (
                      <option key={a.activity_id} value={a.activity_id}>
                        {a.activity_name} ({a.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required
                    value={currentEvent.event_date}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input 
                    type="time" 
                    step="1"
                    className="form-input" 
                    required
                    value={currentEvent.start_time}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, start_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input 
                    type="time" 
                    step="1"
                    className="form-input" 
                    required
                    value={currentEvent.end_time}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="e.g., Main Auditorium, Open Air Theatre (OAT)"
                    value={currentEvent.venue}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, venue: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Status</label>
                  <select 
                    className="form-select"
                    value={currentEvent.status}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, status: e.target.value })}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description & Guidelines</label>
                <textarea 
                  className="form-textarea"
                  rows="3"
                  placeholder="Details regarding event scope, rounds, and eligibility..."
                  value={currentEvent.description}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

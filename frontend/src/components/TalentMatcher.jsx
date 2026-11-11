import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  ExternalLink,
  Award,
  BookOpen,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function TalentMatcher({ selectedEventId, setSelectedEventId }) {
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventId] = useState(selectedEventId || '');
  const [currentEvent, setCurrentEvent] = useState(null);
  const [matchedTalents, setMatchedTalents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executingProc, setExecutingProc] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Skill filter
  const [skillFilter, setSkillFilter] = useState('');

  // Registering in-flight
  const [registeringId, setRegisteringId] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setCurrentEventId(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (currentEventId) {
      loadEventDetails(currentEventId);
      runTalentMatch(currentEventId);
    } else {
      setCurrentEvent(null);
      setMatchedTalents([]);
    }
  }, [currentEventId]);

  async function loadEvents() {
    try {
      const res = await api.getEvents({ status: 'Scheduled' });
      const evs = res.data || [];
      setEvents(evs);
      if (!currentEventId && evs.length > 0) {
        setCurrentEventId(evs[0].event_id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }

  async function loadEventDetails(id) {
    try {
      const res = await api.getEvent(id);
      setCurrentEvent(res.data);
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  }

  async function runTalentMatch(id) {
    try {
      setExecutingProc(true);
      setError(null);
      setSuccessMsg(null);
      const res = await api.matchTalents(id);
      setMatchedTalents(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to execute talent matching procedure');
      setMatchedTalents([]);
    } finally {
      setExecutingProc(false);
    }
  }

  async function handleQuickRegister(talent) {
    setRegisteringId(talent.participant_id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.registerParticipant(currentEventId, {
        participant_id: talent.participant_id,
        role: `${talent.matching_skill} Performer`
      });
      setSuccessMsg(`Registered ${talent.participant_name} successfully for ${currentEvent?.event_name}!`);
      // Refresh matching list
      runTalentMatch(currentEventId);
    } catch (err) {
      setError(`Registration error: ${err.message}`);
    } finally {
      setRegisteringId(null);
    }
  }

  const distinctSkills = Array.from(new Set(matchedTalents.map(t => t.matching_skill))).filter(Boolean);

  const filteredTalents = matchedTalents.filter(t => {
    if (!skillFilter) return true;
    return t.matching_skill === skillFilter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.65rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles color="var(--primary)" />
          <span>Find Event Talent</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Match verified performers with event skill requirements, checking schedule availability and preventing conflicts.
          Filters matching skills, checks availability calendars, and excludes participants with simultaneous event bookings.
        </p>
      </div>

      {/* Event Selection Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Select Target Cultural Event</label>
            <select 
              className="form-select"
              value={currentEventId}
              onChange={(e) => {
                setCurrentEventId(e.target.value);
                setSelectedEventId?.(e.target.value);
              }}
            >
              <option value="">-- Choose an Event --</option>
              {events.map(ev => (
                <option key={ev.event_id} value={ev.event_id}>
                  {ev.event_name} ({ev.event_date} @ {ev.venue})
                </option>
              ))}
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button 
              className="btn btn-primary"
              disabled={!currentEventId || executingProc}
              onClick={() => runTalentMatch(currentEventId)}
            >
              <Sparkles size={16} />
              <span>{executingProc ? 'Finding Talents...' : 'Find Matches'}</span>
            </button>
          </div>
        </div>

        {/* Selected Event Context Pill */}
        {currentEvent && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <div><strong>Host:</strong> {currentEvent.organizer_name} ({currentEvent.club_or_dept})</div>
            <div><strong>Date & Time:</strong> {currentEvent.event_date} ({currentEvent.start_time?.slice(0, 5)} - {currentEvent.end_time?.slice(0, 5)})</div>
            <div><strong>Venue:</strong> {currentEvent.venue}</div>
            <div>
              <strong>Required Skills:</strong>{' '}
              {currentEvent.requirements?.map(r => r.skill_name).join(', ') || 'No skill requirements specified'}
            </div>
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

      

      {/* Filter and Count Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
          Available Qualified Talent Candidates ({filteredTalents.length} Matched)
        </div>

        {distinctSkills.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter Skill:</span>
            <select 
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="">All Skills ({distinctSkills.length})</option>
              {distinctSkills.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Matched Talents Table */}
      {filteredTalents.length === 0 ? (
        <div className="card empty-state">
          <Sparkles size={48} />
          <h3>No Matching Available Talent Found</h3>
          <p>
            No student possesses the required skills for this event, or matching students have a scheduling conflict ('Busy' or double-booked).
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Artist</th>
                  <th>Department & Year</th>
                  <th>Matching Skill</th>
                  <th>Proficiency Level</th>
                  <th>Experience</th>
                  <th>Availability Status</th>
                  <th>Event Status</th>
                  <th style={{ textAlign: 'center' }}>Coordination Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTalents.map((t, i) => {
                  const isRegistered = t.current_event_status && t.current_event_status !== 'Not Registered';
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{t.participant_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {t.usn_or_roll} • {t.participant_email}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{t.department}</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Year {t.year_of_study}</div>
                      </td>
                      <td>
                        <span className="badge badge-nodeclared" style={{ fontWeight: 700 }}>
                          {t.matching_skill}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                          background: t.proficiency_level === 'Professional' ? '#fae8ff' : 
                                      t.proficiency_level === 'Advanced' ? '#e0e7ff' : '#f1f5f9',
                          color: t.proficiency_level === 'Professional' ? '#86198f' : 
                                 t.proficiency_level === 'Advanced' ? '#3730a3' : '#334155'
                        }}>
                          {t.proficiency_level}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {t.years_of_experience} yrs
                      </td>
                      <td>
                        <span className={`badge ${t.availability_status === 'Explicitly Available' ? 'badge-explicit' : 'badge-nodeclared'}`}>
                          {t.availability_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${(t.current_event_status || 'not registered').toLowerCase().replace(/\s+/g, '')}`}>
                          {t.current_event_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isRegistered ? (
                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Check size={14} /> Already Added
                          </span>
                        ) : (
                          <button 
                            className="btn btn-primary btn-sm"
                            disabled={registeringId === t.participant_id}
                            onClick={() => handleQuickRegister(t)}
                          >
                            <UserPlus size={13} />
                            <span>{registeringId === t.participant_id ? 'Adding...' : 'Register'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertCircle, 
  Trophy, 
  Briefcase, 
  Calendar, 
  School,
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsView({ setActiveTab, setSelectedEventId }) {
  const [activeReport, setActiveReport] = useState('deficit');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  async function fetchReport(type) {
    try {
      setLoading(true);
      setError(null);
      let res;
      switch (type) {
        case 'deficit':
          res = await api.getDeficitReport();
          break;
        case 'popular':
          res = await api.getPopularEvents();
          break;
        case 'workload':
          res = await api.getOrganizerSummary();
          break;
        case 'upcoming':
          res = await api.getUpcomingEvents();
          break;
        case 'department':
          res = await api.getDepartmentDistribution();
          break;
        default:
          res = { data: [] };
      }
      setReportData(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  const reportsConfig = {
    deficit: {
      title: 'Query 3: Unfulfilled Event Requirements (Deficit Analysis)',
      icon: AlertCircle,
      description: 'Calculates the open deficit (required headcount minus confirmed participants) for each skill needed in upcoming events.',
      sqlConcept: 'Aggregated COUNT(CASE WHEN status = \'Confirmed\' THEN 1 END) with HAVING deficit > 0.'
    },
    popular: {
      title: 'Query 6: Popular Events Ranked by Participation',
      icon: Trophy,
      description: 'Ranks all collegiate events by total student registration volume using SQL analytical window functions.',
      sqlConcept: 'DENSE_RANK() OVER (ORDER BY COUNT(participation_id) DESC) handling ties gracefully.'
    },
    workload: {
      title: 'Query 4 & 5: Coordinator Workload & Event Summary',
      icon: Briefcase,
      description: 'Summarizes events hosted per organizer, total student participation engaged, and breakdown of scheduled vs completed events.',
      sqlConcept: 'GROUP BY organizer_id with conditional SUM(CASE...) aggregations across events and participation.'
    },
    upcoming: {
      title: 'Query 1: Upcoming Events with Organizer & Theme Info',
      icon: Calendar,
      description: 'Lists all scheduled upcoming events with organizer contact information and activity classifications.',
      sqlConcept: 'INNER JOIN events with organizers and LEFT JOIN with cultural_activities.'
    },
    department: {
      title: 'Query 7: Academic Department Talent Distribution',
      icon: School,
      description: 'Analyzes which academic engineering/science departments contribute the highest active cultural participation.',
      sqlConcept: 'GROUP BY participants.department with COUNT(DISTINCT participant_id) and total event engagements.'
    }
  };

  const currentConfig = reportsConfig[activeReport];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 color="var(--primary)" />
            <span>Analytical Reports & SQL Query Visualizer</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Interactive views executing Member 2 database queries against the 9-table 3NF schema.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchReport(activeReport)}>
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Report Selection Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(reportsConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = activeReport === key;
          return (
            <button
              key={key}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveReport(key)}
            >
              <Icon size={14} />
              <span>{cfg.title.split(':')[0]}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SQL Concept Explanation Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{currentConfig.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
              {currentConfig.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-dark)', background: 'var(--primary-light)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <Database size={15} />
              <span><strong>DBMS Concept:</strong> {currentConfig.sqlConcept}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          {activeReport === 'deficit' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Event Date</th>
                  <th>Organizer / Club</th>
                  <th>Missing Cultural Skill</th>
                  <th>Target Count</th>
                  <th>Confirmed Artists</th>
                  <th>Deficit Headcount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{d.event_name}</td>
                    <td>{d.event_date}</td>
                    <td>{d.organizer_name} ({d.club_or_dept})</td>
                    <td><span className="badge badge-nodeclared">{d.required_skill}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.target_headcount}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>{d.confirmed_headcount}</td>
                    <td>
                      <span className="badge badge-cancelled">-{d.deficit_headcount} slots open</span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedEventId(d.event_id);
                          setActiveTab('matcher');
                        }}
                      >
                        Match Artists
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'popular' && (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                  <th>Event Name</th>
                  <th>Date & Venue</th>
                  <th>Host Coordinator</th>
                  <th>Total Student Applicants</th>
                  <th>Confirmed Performers</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ 
                        background: d.popularity_rank === 1 ? '#fef08a' : d.popularity_rank === 2 ? '#e2e8f0' : '#fed7aa',
                        color: '#854d0e',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        #{d.popularity_rank}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.event_name}</td>
                    <td>{d.event_date} @ {d.venue}</td>
                    <td>{d.organizer_name} ({d.club_or_dept})</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{d.total_registrations}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{d.confirmed_participants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'workload' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Coordinator Name</th>
                  <th>Designation</th>
                  <th>Club / Department</th>
                  <th>Total Events Organized</th>
                  <th>Upcoming Events</th>
                  <th>Completed Events</th>
                  <th>Total Participants Engaged</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{d.full_name}</td>
                    <td>{d.designation}</td>
                    <td>{d.club_or_dept}</td>
                    <td style={{ fontWeight: 700 }}>{d.total_events_organized}</td>
                    <td><span className="badge badge-scheduled">{d.upcoming_events || 0}</span></td>
                    <td><span className="badge badge-completed">{d.completed_events || 0}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{d.total_participants_engaged || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'upcoming' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>Cultural Theme</th>
                  <th>Organizer</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{d.event_name}</td>
                    <td>{d.event_date} ({d.start_time?.slice(0, 5)} - {d.end_time?.slice(0, 5)})</td>
                    <td>{d.venue}</td>
                    <td><span className="badge badge-nodeclared">{d.cultural_theme}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.organizer_name} ({d.organizing_body})</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {d.organizer_email} • {d.organizer_phone}
                    </td>
                    <td><span className={`badge badge-${(d.event_status || 'scheduled').toLowerCase()}`}>{d.event_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'department' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Academic Department</th>
                  <th>Distinct Student Artists</th>
                  <th>Total Event Engagements</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{d.department}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{d.distinct_students} students</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>{d.total_event_engagements} active slots</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

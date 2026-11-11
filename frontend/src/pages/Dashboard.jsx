import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getParticipantStats } from '../api';
import { api as serviceApi } from '../services/api';
import Spinner from '../components/Spinner';

export default function Dashboard({ setSelectedEventId }) {
  const { role, currentUser } = useAuth();
  const navigate = useNavigate();

  const [partStats, setPartStats] = useState(null);
  const [orgStats, setOrgStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        if (role === 'participant') {
          const participantId = currentUser.id || 1;
          const [statsRes, eventsRes] = await Promise.all([
            getParticipantStats(participantId).catch(() => ({ data: { data: {} } })),
            serviceApi.getUpcomingEvents().catch(() => ({ data: [] }))
          ]);
          setPartStats(statsRes.data?.data || {});
          setEvents(eventsRes.data || []);
        } else {
          const [statsRes, eventsRes] = await Promise.all([
            serviceApi.getDashboardStats().catch(() => ({ data: {} })),
            serviceApi.getUpcomingEvents().catch(() => ({ data: [] }))
          ]);
          setOrgStats(statsRes.data || {});
          setEvents(eventsRes.data || []);
        }
      } catch (err) {
        setError('Unable to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [role, currentUser.id]);

  const handleSelectEvent = (eventId) => {
    if (setSelectedEventId) setSelectedEventId(eventId);
    navigate(role === 'organizer' ? '/talent-matcher' : '/events');
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Simple Welcome Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Welcome to KalaConnect
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mb-6 leading-relaxed">
          Discover cultural talent, manage your availability, and coordinate events with ease.
        </p>

        {/* 1-2 Role-specific action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {role === 'participant' ? (
            <>
              <Link
                to="/events"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-md transition shadow-xs"
              >
                Explore Events
              </Link>
              <Link
                to="/availability"
                className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2 rounded-md border border-slate-300 transition shadow-xs"
              >
                Update Availability
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/events"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-md transition shadow-xs"
              >
                Create Event
              </Link>
              <Link
                to="/talent-matcher"
                className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2 rounded-md border border-slate-300 transition shadow-xs"
              >
                Find Talents
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Role-Specific Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {role === 'participant' ? (
          <>
            <StatCard label="My Skills" value={partStats?.my_skills ?? 0} />
            <StatCard label="Available Time Slots" value={partStats?.available_slots ?? 0} />
            <StatCard label="Upcoming Events" value={partStats?.upcoming_events ?? 0} />
            <StatCard label="My Registrations" value={partStats?.my_registrations ?? 0} />
          </>
        ) : (
          <>
            <StatCard label="Total Events" value={orgStats?.total_events ?? 0} />
            <StatCard label="Upcoming Events" value={orgStats?.upcoming_events ?? 0} />
            <StatCard label="Pending Registrations" value={orgStats?.pending_registrations ?? 0} />
            <StatCard label="Approved Participants" value={orgStats?.approved_participants ?? 0} />
          </>
        )}
      </div>

      {/* Upcoming Events Overview Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Upcoming Cultural Events</h2>
          <Link to="/events" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
            View All ({events.length})
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No upcoming events scheduled at this moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Venue</th>
                  <th className="px-6 py-3">Cultural Theme</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.slice(0, 5).map((ev) => (
                  <tr key={ev.event_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      <div>{ev.event_name}</div>
                      <div className="text-xs text-slate-500">{ev.organizing_body || ev.organizer_name}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      <div>{new Date(ev.event_date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">{ev.start_time} - {ev.end_time}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{ev.venue}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {ev.cultural_theme}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleSelectEvent(ev.event_id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition"
                      >
                        {role === 'organizer' ? 'Find Talents' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
    </div>
  );
}

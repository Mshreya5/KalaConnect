import { useEffect, useState } from 'react';
import { getDashboardStats } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data))
      .catch(() => setError('Could not load dashboard stats. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">Dashboard</h1>
      <Alert type="error" message={error} />

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Registered Participants" value={stats.participantCount} color="indigo" />
            <StatCard label="Total Skills" value={stats.skillCount} color="purple" />
            <StatCard label="Available Slots" value={stats.availabilityCount} color="green" />
          </div>

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Artists by Category</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-indigo-700">
                <tr>
                  <th className="text-left px-4 py-2">Category</th>
                  <th className="text-right px-4 py-2">Artists</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryStats.map((row) => (
                  <tr key={row.category} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{row.category}</td>
                    <td className="px-4 py-2 text-right font-medium">{row.artist_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
  };
  return (
    <div className={`${colors[color]} text-white rounded-lg p-5 shadow`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-90">{label}</p>
    </div>
  );
}

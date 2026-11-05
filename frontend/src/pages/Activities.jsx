import { useEffect, useState } from 'react';
import { getActivities, getActivitySkills } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getActivities()
      .then((r) => setActivities(r.data))
      .catch(() => setError('Failed to load activities'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (activity) => {
    if (selected?.activity_id === activity.activity_id) { setSelected(null); setSkills([]); return; }
    setSelected(activity);
    setSkillsLoading(true);
    getActivitySkills(activity.activity_id)
      .then((r) => setSkills(r.data.skills))
      .catch(() => setError('Failed to load skills'))
      .finally(() => setSkillsLoading(false));
  };

  const categoryColors = {
    'Performing Arts': 'bg-pink-100 text-pink-700',
    'Musical Arts': 'bg-yellow-100 text-yellow-700',
    'Visual Arts': 'bg-blue-100 text-blue-700',
    'Literary Arts': 'bg-green-100 text-green-700',
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">Cultural Activities</h1>
      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activities.map((a) => (
          <div key={a.activity_id} className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition" onClick={() => handleSelect(a)}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-800">{a.activity_name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[a.category] || 'bg-gray-100 text-gray-600'}`}>
                {a.category}
              </span>
            </div>
            <p className="text-sm text-gray-500">{a.description}</p>
            {selected?.activity_id === a.activity_id && (
              <div className="mt-3 border-t pt-3">
                {skillsLoading ? <Spinner /> : (
                  <ul className="space-y-1">
                    {skills.map((s) => (
                      <li key={s.skill_id} className="text-sm text-gray-700">
                        <span className="font-medium">• {s.skill_name}</span>
                        {s.description && <span className="text-gray-500"> — {s.description}</span>}
                      </li>
                    ))}
                    {skills.length === 0 && <li className="text-sm text-gray-400">No skills listed.</li>}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

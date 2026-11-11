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
    if (selected?.activity_id === activity.activity_id) { 
      setSelected(null); 
      setSkills([]); 
      return; 
    }
    setSelected(activity);
    setSkillsLoading(true);
    getActivitySkills(activity.activity_id)
      .then((r) => setSkills(r.data.skills))
      .catch(() => setError('Failed to load skills'))
      .finally(() => setSkillsLoading(false));
  };

  const categoryBadgeStyles = {
    'Performing Arts': 'bg-pink-50 text-pink-700 border-pink-200',
    'Musical Arts': 'bg-amber-50 text-amber-700 border-amber-200',
    'Visual Arts': 'bg-blue-50 text-blue-700 border-blue-200',
    'Literary Arts': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cultural Activities & Disciplines</h1>
        <p className="text-sm text-slate-600 mt-1">
          Explore campus cultural domains and their corresponding artistic disciplines and skills.
        </p>
      </div>

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activities.map((a) => {
          const isSelected = selected?.activity_id === a.activity_id;
          return (
            <div 
              key={a.activity_id} 
              className={`bg-white rounded-lg border p-5 cursor-pointer transition shadow-xs ${
                isSelected ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'
              }`} 
              onClick={() => handleSelect(a)}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-900 text-base">{a.activity_name}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${categoryBadgeStyles[a.category] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {a.category}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
              
              <div className="mt-3 text-xs font-medium text-indigo-600">
                {isSelected ? '▲ Hide associated skills' : '▼ View associated skills'}
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Included Skills:
                  </h3>
                  {skillsLoading ? (
                    <Spinner />
                  ) : (
                    <ul className="space-y-1.5">
                      {skills.map((s) => (
                        <li key={s.skill_id} className="text-sm text-slate-800 flex items-start gap-1.5">
                          <span className="text-indigo-600 font-bold">•</span>
                          <div>
                            <span className="font-medium">{s.skill_name}</span>
                            {s.description && (
                              <span className="text-slate-500 text-xs block">{s.description}</span>
                            )}
                          </div>
                        </li>
                      ))}
                      {skills.length === 0 && (
                        <li className="text-sm text-slate-400">No specific skills registered under this activity yet.</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

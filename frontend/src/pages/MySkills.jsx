import { useEffect, useState } from 'react';
import { 
  getParticipants, 
  getParticipantSkills, 
  addParticipantSkill, 
  updateParticipantSkill, 
  removeParticipantSkill, 
  getActivities, 
  getActivitySkills 
} from '../api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export default function MySkills() {
  const { role, currentUser } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [selectedPid, setSelectedPid] = useState('');
  const [skills, setSkills] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activitySkills, setActivitySkills] = useState([]);
  const [form, setForm] = useState({ skill_id: '', proficiency_level: 'Intermediate', years_of_experience: '', portfolio_url: '' });
  const [editSkillId, setEditSkillId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([getParticipants(), getActivities()]).then(([pRes, aRes]) => {
      setParticipants(pRes.data);
      setActivities(aRes.data);

      // Auto-select logged-in participant or the first participant in list
      const defaultId = currentUser?.id 
        ? String(currentUser.id) 
        : pRes.data?.[0]?.participant_id 
          ? String(pRes.data[0].participant_id) 
          : '';
      
      if (defaultId) {
        setSelectedPid(defaultId);
        loadSkills(defaultId);
      }
    });
  }, [currentUser?.id]);

  const loadSkills = (pid) => {
    if (!pid) return;
    setLoading(true);
    getParticipantSkills(pid)
      .then((r) => setSkills(r.data))
      .catch(() => setError('Failed to load skills'))
      .finally(() => setLoading(false));
  };

  const handleParticipantChange = (pid) => {
    setSelectedPid(pid);
    setError(''); 
    setSuccess(''); 
    setEditSkillId(null);
    setForm({ skill_id: '', proficiency_level: 'Intermediate', years_of_experience: '', portfolio_url: '' });
    if (pid) loadSkills(pid);
    else setSkills([]);
  };

  const handleActivityChange = (actId) => {
    if (!actId) { setActivitySkills([]); return; }
    getActivitySkills(actId).then((r) => setActivitySkills(r.data.skills));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editSkillId) {
        await updateParticipantSkill(selectedPid, editSkillId, { 
          proficiency_level: form.proficiency_level, 
          years_of_experience: form.years_of_experience || undefined, 
          portfolio_url: form.portfolio_url || undefined 
        });
        setSuccess('Skill updated successfully');
      } else {
        await addParticipantSkill(selectedPid, { ...form, years_of_experience: form.years_of_experience || 0 });
        setSuccess('Skill added successfully');
      }
      setForm({ skill_id: '', proficiency_level: 'Intermediate', years_of_experience: '', portfolio_url: '' });
      setEditSkillId(null);
      loadSkills(selectedPid);
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (s) => {
    setEditSkillId(s.skill_id);
    setForm({ 
      skill_id: s.skill_id, 
      proficiency_level: s.proficiency_level, 
      years_of_experience: s.years_of_experience, 
      portfolio_url: s.portfolio_url || '' 
    });
    setError(''); setSuccess('');
  };

  const handleRemove = async (skillId) => {
    if (!window.confirm('Remove this skill from your profile?')) return;
    try {
      await removeParticipantSkill(selectedPid, skillId);
      setSuccess('Skill removed successfully');
      loadSkills(selectedPid);
    } catch (err) {
      setError(err.response?.data?.error || 'Remove failed');
    }
  };

  const proficiencyStyles = {
    Beginner: 'bg-slate-100 text-slate-700 border-slate-200',
    Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Professional: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const selectedParticipant = participants.find(p => String(p.participant_id) === String(selectedPid));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cultural Skills & Talents</h1>
          <p className="text-sm text-slate-600 mt-1">
            Showcase your artistic disciplines, proficiency levels, and portfolios for event casting.
          </p>
        </div>

        {/* Participant Switcher (clean select) */}
        <div className="flex items-center gap-2 self-start">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Viewing Profile:
          </label>
          <select 
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-800 focus:outline-none focus:border-indigo-600"
            value={selectedPid} 
            onChange={(e) => handleParticipantChange(e.target.value)}
          >
            <option value="">-- Choose a participant --</option>
            {participants.map((p) => (
              <option key={p.participant_id} value={p.participant_id}>
                {p.full_name} ({p.college_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedPid && (
        <>
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          {/* Add / Edit Skill Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editSkillId ? 'Update Skill Details' : 'Add New Skill to Profile'}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!editSkillId && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Cultural Domain / Activity
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                      onChange={(e) => handleActivityChange(e.target.value)}
                    >
                      <option value="">Select activity domain</option>
                      {activities.map((a) => <option key={a.activity_id} value={a.activity_id}>{a.activity_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Specific Skill *
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                      value={form.skill_id} 
                      onChange={(e) => setForm({ ...form, skill_id: e.target.value })} 
                      required
                    >
                      <option value="">Select skill</option>
                      {activitySkills.map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proficiency Level *
                </label>
                <select 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.proficiency_level} 
                  onChange={(e) => setForm({ ...form, proficiency_level: e.target.value })} 
                  required
                >
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Years of Experience
                </label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.5" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.years_of_experience} 
                  onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} 
                  placeholder="e.g., 3.5" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Portfolio / Performance URL
                </label>
                <input 
                  type="url" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.portfolio_url} 
                  onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} 
                  placeholder="https://instagram.com/myart or https://youtube.com/..." 
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2 rounded-md transition shadow-xs"
                >
                  {editSkillId ? 'Save Changes' : 'Add Skill'}
                </button>
                {editSkillId && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setEditSkillId(null); 
                      setForm({ skill_id: '', proficiency_level: 'Intermediate', years_of_experience: '', portfolio_url: '' }); 
                    }} 
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm px-4 py-2 rounded-md transition shadow-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Registered Skills Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Registered Skills for {selectedParticipant?.full_name || 'Participant'} ({skills.length})
              </h2>
              <span className="text-xs text-slate-500">
                These skills are used to match you with event requirements
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center"><Spinner /></div>
            ) : skills.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No cultural skills registered yet. Use the form above to add your first skill!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Skill</th>
                      <th className="px-6 py-3">Domain</th>
                      <th className="px-6 py-3">Proficiency</th>
                      <th className="px-6 py-3">Experience</th>
                      <th className="px-6 py-3">Portfolio</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {skills.map((s) => (
                      <tr key={s.skill_id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-medium text-slate-900">{s.skill_name}</td>
                        <td className="px-6 py-3.5 text-slate-600">{s.activity_name}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${proficiencyStyles[s.proficiency_level] || 'bg-slate-100 text-slate-700'}`}>
                            {s.proficiency_level}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">{s.years_of_experience} yrs</td>
                        <td className="px-6 py-3.5">
                          {s.portfolio_url ? (
                            <a 
                              href={s.portfolio_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
                            >
                              View Link ↗
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-2">
                          <button 
                            onClick={() => handleEdit(s)} 
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                          >
                            Edit
                          </button>
                          <span className="text-slate-300">|</span>
                          <button 
                            onClick={() => handleRemove(s.skill_id)} 
                            className="text-xs font-medium text-red-600 hover:text-red-800 transition"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getParticipants, getParticipantSkills, addParticipantSkill, updateParticipantSkill, removeParticipantSkill, getActivities, getActivitySkills } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

export default function MySkills() {
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
    getParticipants().then((r) => setParticipants(r.data));
    getActivities().then((r) => setActivities(r.data));
  }, []);

  const loadSkills = (pid) => {
    setLoading(true);
    getParticipantSkills(pid)
      .then((r) => setSkills(r.data))
      .catch(() => setError('Failed to load skills'))
      .finally(() => setLoading(false));
  };

  const handleParticipantChange = (pid) => {
    setSelectedPid(pid);
    setError(''); setSuccess(''); setEditSkillId(null);
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
        await updateParticipantSkill(selectedPid, editSkillId, { proficiency_level: form.proficiency_level, years_of_experience: form.years_of_experience || undefined, portfolio_url: form.portfolio_url || undefined });
        setSuccess('Skill updated');
      } else {
        await addParticipantSkill(selectedPid, { ...form, years_of_experience: form.years_of_experience || 0 });
        setSuccess('Skill added');
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
    setForm({ skill_id: s.skill_id, proficiency_level: s.proficiency_level, years_of_experience: s.years_of_experience, portfolio_url: s.portfolio_url || '' });
    setError(''); setSuccess('');
  };

  const handleRemove = async (skillId) => {
    if (!window.confirm('Remove this skill?')) return;
    try {
      await removeParticipantSkill(selectedPid, skillId);
      setSuccess('Skill removed');
      loadSkills(selectedPid);
    } catch (err) {
      setError(err.response?.data?.error || 'Remove failed');
    }
  };

  const proficiencyBadge = { Beginner: 'bg-gray-100 text-gray-600', Intermediate: 'bg-blue-100 text-blue-700', Advanced: 'bg-purple-100 text-purple-700', Professional: 'bg-green-100 text-green-700' };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">My Skills</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Participant</label>
        <select className="border rounded px-3 py-2 text-sm w-full sm:w-72" value={selectedPid} onChange={(e) => handleParticipantChange(e.target.value)}>
          <option value="">-- Choose a participant --</option>
          {participants.map((p) => <option key={p.participant_id} value={p.participant_id}>{p.full_name} ({p.college_id})</option>)}
        </select>
      </div>

      {selectedPid && (
        <>
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <h2 className="sm:col-span-2 font-semibold text-gray-700">{editSkillId ? 'Update Skill' : 'Add Skill'}</h2>

            {!editSkillId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" onChange={(e) => handleActivityChange(e.target.value)}>
                    <option value="">Select activity first</option>
                    {activities.map((a) => <option key={a.activity_id} value={a.activity_id}>{a.activity_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skill *</label>
                  <select className="w-full border rounded px-3 py-2 text-sm" value={form.skill_id} onChange={(e) => setForm({ ...form, skill_id: e.target.value })} required>
                    <option value="">Select skill</option>
                    {activitySkills.map((s) => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency *</label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.proficiency_level} onChange={(e) => setForm({ ...form, proficiency_level: e.target.value })} required>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              <input type="number" min="0" step="0.5" className="w-full border rounded px-3 py-2 text-sm" value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} placeholder="e.g. 3.5" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
              <input type="url" className="w-full border rounded px-3 py-2 text-sm" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://..." />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 text-sm">
                {editSkillId ? 'Update Skill' : 'Add Skill'}
              </button>
              {editSkillId && (
                <button type="button" onClick={() => { setEditSkillId(null); setForm({ skill_id: '', proficiency_level: 'Intermediate', years_of_experience: '', portfolio_url: '' }); }} className="border px-5 py-2 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Registered Skills</h2>
          {loading ? <Spinner /> : skills.length === 0 ? (
            <p className="text-gray-500 text-sm">No skills added yet.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-indigo-50 text-indigo-700">
                  <tr>{['Skill', 'Activity', 'Proficiency', 'Experience', 'Portfolio', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {skills.map((s) => (
                    <tr key={s.skill_id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{s.skill_name}</td>
                      <td className="px-4 py-2 text-gray-500">{s.activity_name}</td>
                      <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${proficiencyBadge[s.proficiency_level]}`}>{s.proficiency_level}</span></td>
                      <td className="px-4 py-2">{s.years_of_experience} yrs</td>
                      <td className="px-4 py-2">{s.portfolio_url ? <a href={s.portfolio_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">View</a> : '—'}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                        <button onClick={() => handleRemove(s.skill_id)} className="text-red-500 hover:underline text-xs">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

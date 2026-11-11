import { useEffect, useState } from 'react';
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '../api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const EMPTY_FORM = { full_name: '', email: '', phone: '', college_id: '', department: '', year_of_study: '', bio: '' };
const DEPTS = ['Computer Science', 'Electronics & Comm.', 'Mechanical Engg', 'Civil Engg', 'Information Science', 'Electrical Engg', 'Chemical Engg', 'Other'];

export default function Participants() {
  const { role, currentUser } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getParticipants()
      .then((r) => {
        setParticipants(r.data);
        // If in participant mode and not already editing, auto-fill current user profile for quick edit
        if (role === 'participant' && currentUser?.id && !editId) {
          const me = r.data.find(p => String(p.participant_id) === String(currentUser.id));
          if (me) {
            setEditId(me.participant_id);
            setForm({
              full_name: me.full_name || '',
              email: me.email || '',
              phone: me.phone || '',
              college_id: me.college_id || '',
              department: me.department || '',
              year_of_study: me.year_of_study || '',
              bio: me.bio || ''
            });
          }
        }
      })
      .catch(() => setError('Failed to load participants'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [role, currentUser?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (editId) {
        await updateParticipant(editId, form);
        setSuccess('Profile updated successfully');
      } else {
        await createParticipant(form);
        setSuccess('Participant registered successfully');
      }
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.participant_id);
    setForm({
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      college_id: p.college_id,
      department: p.department,
      year_of_study: p.year_of_study,
      bio: p.bio || ''
    });
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this participant?')) return;
    try {
      await deleteParticipant(id);
      setSuccess('Participant deleted');
      if (editId === id) {
        setEditId(null);
        setForm(EMPTY_FORM);
      }
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleNewRegistration = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {role === 'participant' ? 'My Profile' : 'Participant Directory'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {role === 'participant' 
              ? 'Manage your personal details, college affiliation, and cultural bio.' 
              : 'View and manage registered participant profiles.'}
          </p>
        </div>
        {editId && (
          <button
            type="button"
            onClick={handleNewRegistration}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 transition self-start"
          >
            + Register Another Participant
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          {editId ? 'Edit Profile Details' : 'Register New Participant'}
        </h2>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field 
            label="Full Name *" 
            value={form.full_name} 
            onChange={(v) => setForm({ ...form, full_name: v })} 
            required 
            placeholder="e.g., Aarav Sharma"
          />
          <Field 
            label="Email Address *" 
            type="email" 
            value={form.email} 
            onChange={(v) => setForm({ ...form, email: v })} 
            required 
            placeholder="e.g., aarav@college.edu"
          />
          <Field 
            label="Phone Number *" 
            value={form.phone} 
            onChange={(v) => setForm({ ...form, phone: v })} 
            required 
            placeholder="e.g., 9876543210"
          />
          <Field 
            label="College ID / USN *" 
            value={form.college_id} 
            onChange={(v) => setForm({ ...form, college_id: v })} 
            required 
            placeholder="e.g., 1MS21CS001"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department *
            </label>
            <select 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" 
              value={form.department} 
              onChange={(e) => setForm({ ...form, department: e.target.value })} 
              required
            >
              <option value="">Select department</option>
              {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Year of Study *
            </label>
            <select 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" 
              value={form.year_of_study} 
              onChange={(e) => setForm({ ...form, year_of_study: e.target.value })} 
              required
            >
              <option value="">Select year</option>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cultural Bio
            </label>
            <textarea 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" 
              rows={2} 
              value={form.bio} 
              onChange={(e) => setForm({ ...form, bio: e.target.value })} 
              placeholder="Brief description of your cultural background, interests, or achievements..." 
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3 pt-2">
            <button 
              type="submit" 
              disabled={submitting} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2 rounded-md transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editId ? 'Save Changes' : 'Register Participant'}
            </button>
            {editId && (
              <button 
                type="button" 
                onClick={handleNewRegistration} 
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm px-4 py-2 rounded-md transition shadow-xs"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Registered Participants ({participants.length})
          </h2>
          <span className="text-xs text-slate-500">
            Select Edit to update any participant profile
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : participants.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No participants registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">College ID</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((p) => {
                  const isCurrent = editId === p.participant_id;
                  return (
                    <tr key={p.participant_id} className={`hover:bg-slate-50 transition ${isCurrent ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {p.full_name}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{p.email}</td>
                      <td className="px-6 py-3.5 text-slate-700">{p.college_id}</td>
                      <td className="px-6 py-3.5 text-slate-700">{p.department}</td>
                      <td className="px-6 py-3.5 text-slate-600">Year {p.year_of_study}</td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <button 
                          onClick={() => handleEdit(p)} 
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={() => handleDelete(p.participant_id)} 
                          className="text-xs font-medium text-red-600 hover:text-red-800 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input 
        type={type} 
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required={required} 
        placeholder={placeholder}
      />
    </div>
  );
}

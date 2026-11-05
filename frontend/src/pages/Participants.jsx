import { useEffect, useState } from 'react';
import { getParticipants, createParticipant, updateParticipant, deleteParticipant } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const EMPTY_FORM = { full_name: '', email: '', phone: '', college_id: '', department: '', year_of_study: '', bio: '' };
const DEPTS = ['Computer Science', 'Electronics & Comm.', 'Mechanical Engg', 'Civil Engg', 'Information Science', 'Electrical Engg', 'Chemical Engg', 'Other'];

export default function Participants() {
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
      .then((r) => setParticipants(r.data))
      .catch(() => setError('Failed to load participants'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (editId) {
        await updateParticipant(editId, form);
        setSuccess('Participant updated successfully');
      } else {
        await createParticipant(form);
        setSuccess('Participant registered successfully');
      }
      setForm(EMPTY_FORM); setEditId(null); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.participant_id);
    setForm({ full_name: p.full_name, email: p.email, phone: p.phone, college_id: p.college_id, department: p.department, year_of_study: p.year_of_study, bio: p.bio || '' });
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this participant?')) return;
    try {
      await deleteParticipant(id);
      setSuccess('Participant deleted'); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">{editId ? 'Edit Participant' : 'Register Participant'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <Field label="Full Name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
        <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="College ID / USN *" value={form.college_id} onChange={(v) => setForm({ ...form, college_id: v })} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <select className="w-full border rounded px-3 py-2 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
            <option value="">Select department</option>
            {DEPTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study *</label>
          <select className="w-full border rounded px-3 py-2 text-sm" value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })} required>
            <option value="">Select year</option>
            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio (optional)" />
        </div>

        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm">
            {submitting ? 'Saving...' : editId ? 'Update' : 'Register'}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm(EMPTY_FORM); setError(''); setSuccess(''); }} className="border px-5 py-2 rounded text-sm hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">All Participants</h2>
      {loading ? <Spinner /> : participants.length === 0 ? (
        <p className="text-gray-500 text-sm">No participants registered yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50 text-indigo-700">
              <tr>
                {['Name', 'Email', 'College ID', 'Department', 'Year', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.participant_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{p.full_name}</td>
                  <td className="px-4 py-2 text-gray-600">{p.email}</td>
                  <td className="px-4 py-2">{p.college_id}</td>
                  <td className="px-4 py-2">{p.department}</td>
                  <td className="px-4 py-2">Year {p.year_of_study}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(p.participant_id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} className="w-full border rounded px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

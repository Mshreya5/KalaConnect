import { useEffect, useState } from 'react';
import { getParticipants, getParticipantAvailability, createAvailability, updateAvailability, deleteAvailability } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const STATUSES = ['Available', 'Busy', 'Tentative'];
const EMPTY_FORM = { available_date: '', start_time: '', end_time: '', status: 'Available' };

const statusColors = { Available: 'bg-green-100 text-green-700', Busy: 'bg-red-100 text-red-700', Tentative: 'bg-yellow-100 text-yellow-700' };

export default function Availability() {
  const [participants, setParticipants] = useState([]);
  const [selectedPid, setSelectedPid] = useState('');
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { getParticipants().then((r) => setParticipants(r.data)); }, []);

  const loadSlots = (pid) => {
    setLoading(true);
    getParticipantAvailability(pid)
      .then((r) => setSlots(r.data))
      .catch(() => setError('Failed to load availability'))
      .finally(() => setLoading(false));
  };

  const handleParticipantChange = (pid) => {
    setSelectedPid(pid);
    setError(''); setSuccess(''); setEditId(null); setForm(EMPTY_FORM);
    if (pid) loadSlots(pid); else setSlots([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editId) {
        await updateAvailability(editId, form);
        setSuccess('Slot updated');
      } else {
        await createAvailability(selectedPid, form);
        setSuccess('Slot added');
      }
      setForm(EMPTY_FORM); setEditId(null); loadSlots(selectedPid);
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (slot) => {
    setEditId(slot.availability_id);
    setForm({
      available_date: slot.available_date?.split('T')[0] || slot.available_date,
      start_time: slot.start_time?.slice(0, 5),
      end_time: slot.end_time?.slice(0, 5),
      status: slot.status,
    });
    setError(''); setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await deleteAvailability(id);
      setSuccess('Slot deleted'); loadSlots(selectedPid);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">Availability</h1>

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
            <h2 className="sm:col-span-2 font-semibold text-gray-700">{editId ? 'Edit Slot' : 'Add Availability Slot'}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={form.available_date} onChange={(e) => setForm({ ...form, available_date: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input type="time" className="w-full border rounded px-3 py-2 text-sm" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input type="time" className="w-full border rounded px-3 py-2 text-sm" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 text-sm">
                {editId ? 'Update Slot' : 'Add Slot'}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setForm(EMPTY_FORM); }} className="border px-5 py-2 rounded text-sm hover:bg-gray-50">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2 className="text-lg font-semibold text-gray-700 mb-3">Scheduled Slots</h2>
          {loading ? <Spinner /> : slots.length === 0 ? (
            <p className="text-gray-500 text-sm">No availability slots added yet.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-indigo-50 text-indigo-700">
                  <tr>{['Date', 'Start', 'End', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.availability_id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{s.available_date?.split('T')[0] || s.available_date}</td>
                      <td className="px-4 py-2">{s.start_time?.slice(0, 5)}</td>
                      <td className="px-4 py-2">{s.end_time?.slice(0, 5)}</td>
                      <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status]}`}>{s.status}</span></td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => handleEdit(s)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                        <button onClick={() => handleDelete(s.availability_id)} className="text-red-500 hover:underline text-xs">Delete</button>
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

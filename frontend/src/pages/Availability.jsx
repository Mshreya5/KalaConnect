import { useEffect, useState } from 'react';
import { 
  getParticipants, 
  getParticipantAvailability, 
  createAvailability, 
  updateAvailability, 
  deleteAvailability 
} from '../api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const STATUSES = ['Available', 'Busy', 'Tentative'];
const EMPTY_FORM = { available_date: '', start_time: '', end_time: '', status: 'Available' };

const statusStyles = { 
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
  Busy: 'bg-red-50 text-red-700 border-red-200', 
  Tentative: 'bg-amber-50 text-amber-700 border-amber-200' 
};

export default function Availability() {
  const { role, currentUser } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [selectedPid, setSelectedPid] = useState('');
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { 
    getParticipants().then((r) => {
      setParticipants(r.data);
      const defaultId = currentUser?.id 
        ? String(currentUser.id) 
        : r.data?.[0]?.participant_id 
          ? String(r.data[0].participant_id) 
          : '';
      
      if (defaultId) {
        setSelectedPid(defaultId);
        loadSlots(defaultId);
      }
    }); 
  }, [currentUser?.id]);

  const loadSlots = (pid) => {
    if (!pid) return;
    setLoading(true);
    getParticipantAvailability(pid)
      .then((r) => setSlots(r.data))
      .catch(() => setError('Failed to load availability'))
      .finally(() => setLoading(false));
  };

  const handleParticipantChange = (pid) => {
    setSelectedPid(pid);
    setError(''); 
    setSuccess(''); 
    setEditId(null); 
    setForm(EMPTY_FORM);
    if (pid) loadSlots(pid); 
    else setSlots([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    try {
      if (editId) {
        await updateAvailability(editId, form);
        setSuccess('Availability slot updated successfully');
      } else {
        await createAvailability(selectedPid, form);
        setSuccess('Availability slot added successfully');
      }
      setForm(EMPTY_FORM); 
      setEditId(null); 
      loadSlots(selectedPid);
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
    setError(''); 
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await deleteAvailability(id);
      setSuccess('Slot removed successfully'); 
      loadSlots(selectedPid);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const selectedParticipant = participants.find(p => String(p.participant_id) === String(selectedPid));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Availability & Schedules</h1>
          <p className="text-sm text-slate-600 mt-1">
            Declare your available calendar dates and time slots for auditions, rehearsals, and performances.
          </p>
        </div>

        {/* Participant Switcher */}
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

          {/* Form Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editId ? 'Edit Availability Slot' : 'Add Availability Slot'}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date *
                </label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.available_date} 
                  onChange={(e) => setForm({ ...form, available_date: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.status} 
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Time *
                </label>
                <input 
                  type="time" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.start_time} 
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  End Time *
                </label>
                <input 
                  type="time" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
                  value={form.end_time} 
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })} 
                  required 
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2 rounded-md transition shadow-xs"
                >
                  {editId ? 'Save Changes' : 'Add Time Slot'}
                </button>
                {editId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditId(null); setForm(EMPTY_FORM); }} 
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-sm px-4 py-2 rounded-md transition shadow-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Slots Table Card */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Declared Slots for {selectedParticipant?.full_name || 'Participant'} ({slots.length})
              </h2>
              <span className="text-xs text-slate-500">
                Organizers check these slots before casting events
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center"><Spinner /></div>
            ) : slots.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No availability slots declared yet. Use the form above to add your free hours!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Start Time</th>
                      <th className="px-6 py-3">End Time</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {slots.map((s) => (
                      <tr key={s.availability_id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {s.available_date?.split('T')[0] || s.available_date}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">{s.start_time?.slice(0, 5)}</td>
                        <td className="px-6 py-3.5 text-slate-700">{s.end_time?.slice(0, 5)}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusStyles[s.status] || 'bg-slate-100 text-slate-700'}`}>
                            {s.status}
                          </span>
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
                            onClick={() => handleDelete(s.availability_id)} 
                            className="text-xs font-medium text-red-600 hover:text-red-800 transition"
                          >
                            Delete
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

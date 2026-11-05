import { useState } from 'react';
import { searchTalents, getAvailableTalents } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Professional'];
const CATEGORIES = ['', 'Performing Arts', 'Musical Arts', 'Visual Arts', 'Literary Arts'];

const proficiencyBadge = { Beginner: 'bg-gray-100 text-gray-600', Intermediate: 'bg-blue-100 text-blue-700', Advanced: 'bg-purple-100 text-purple-700', Professional: 'bg-green-100 text-green-700' };

export default function TalentSearch() {
  const [tab, setTab] = useState('skill');
  const [skillForm, setSkillForm] = useState({ skill: '', category: '', proficiency: '' });
  const [availForm, setAvailForm] = useState({ date: '', startTime: '', endTime: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSkillSearch = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setSearched(true);
    try {
      const r = await searchTalents({ skill: skillForm.skill || undefined, category: skillForm.category || undefined, proficiency: skillForm.proficiency || undefined });
      setResults(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailSearch = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setSearched(true);
    try {
      const r = await getAvailableTalents({ date: availForm.date, startTime: availForm.startTime, endTime: availForm.endTime });
      setResults(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">Talent Search</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setTab('skill'); setResults([]); setSearched(false); }} className={`px-4 py-2 rounded text-sm font-medium ${tab === 'skill' ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-50'}`}>Search by Skill</button>
        <button onClick={() => { setTab('avail'); setResults([]); setSearched(false); }} className={`px-4 py-2 rounded text-sm font-medium ${tab === 'avail' ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-50'}`}>Search by Availability</button>
      </div>

      <Alert type="error" message={error} />

      {tab === 'skill' && (
        <form onSubmit={handleSkillSearch} className="bg-white rounded-lg shadow p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
            <input className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Bharatanatyam" value={skillForm.skill} onChange={(e) => setSkillForm({ ...skillForm, skill: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full border rounded px-3 py-2 text-sm" value={skillForm.category} onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
            <select className="w-full border rounded px-3 py-2 text-sm" value={skillForm.proficiency} onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}>
              {LEVELS.map((l) => <option key={l} value={l}>{l || 'Any Level'}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 text-sm">Search</button>
          </div>
        </form>
      )}

      {tab === 'avail' && (
        <form onSubmit={handleAvailSearch} className="bg-white rounded-lg shadow p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={availForm.date} onChange={(e) => setAvailForm({ ...availForm, date: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Time *</label>
            <input type="time" className="w-full border rounded px-3 py-2 text-sm" value={availForm.startTime} onChange={(e) => setAvailForm({ ...availForm, startTime: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Time *</label>
            <input type="time" className="w-full border rounded px-3 py-2 text-sm" value={availForm.endTime} onChange={(e) => setAvailForm({ ...availForm, endTime: e.target.value })} required />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 text-sm">Find Available Talent</button>
          </div>
        </form>
      )}

      {loading && <Spinner />}

      {!loading && searched && (
        results.length === 0 ? (
          <p className="text-gray-500 text-sm">No results found for your search criteria.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <p className="text-sm text-gray-500 px-4 pt-3">{results.length} result(s) found</p>
            <table className="w-full text-sm mt-2">
              <thead className="bg-indigo-50 text-indigo-700">
                <tr>
                  {tab === 'skill'
                    ? ['Name', 'Dept', 'Year', 'Skill', 'Category', 'Proficiency', 'Experience', 'Portfolio'].map((h) => <th key={h} className="text-left px-4 py-2">{h}</th>)
                    : ['Name', 'Email', 'Dept', 'Year', 'Date', 'Available From', 'Available To'].map((h) => <th key={h} className="text-left px-4 py-2">{h}</th>)
                  }
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {tab === 'skill' ? (
                      <>
                        <td className="px-4 py-2 font-medium">{r.full_name}</td>
                        <td className="px-4 py-2 text-gray-500">{r.department}</td>
                        <td className="px-4 py-2">Yr {r.year_of_study}</td>
                        <td className="px-4 py-2">{r.skill_name}</td>
                        <td className="px-4 py-2 text-gray-500">{r.category}</td>
                        <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${proficiencyBadge[r.proficiency_level]}`}>{r.proficiency_level}</span></td>
                        <td className="px-4 py-2">{r.years_of_experience} yrs</td>
                        <td className="px-4 py-2">{r.portfolio_url ? <a href={r.portfolio_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">View</a> : '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-medium">{r.full_name}</td>
                        <td className="px-4 py-2 text-gray-500">{r.email}</td>
                        <td className="px-4 py-2">{r.department}</td>
                        <td className="px-4 py-2">Yr {r.year_of_study}</td>
                        <td className="px-4 py-2">{r.available_date?.split('T')[0] || r.available_date}</td>
                        <td className="px-4 py-2">{r.start_time?.slice(0, 5)}</td>
                        <td className="px-4 py-2">{r.end_time?.slice(0, 5)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

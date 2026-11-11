import { useState } from 'react';
import { searchTalents, getAvailableTalents } from '../api';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Professional'];
const CATEGORIES = ['', 'Performing Arts', 'Musical Arts', 'Visual Arts', 'Literary Arts'];

const proficiencyStyles = { 
  Beginner: 'bg-slate-100 text-slate-700 border-slate-200', 
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200', 
  Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
  Professional: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
};

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
    setError(''); 
    setLoading(true); 
    setSearched(true);
    try {
      const r = await searchTalents({ 
        skill: skillForm.skill || undefined, 
        category: skillForm.category || undefined, 
        proficiency: skillForm.proficiency || undefined 
      });
      setResults(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailSearch = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true); 
    setSearched(true);
    try {
      const r = await getAvailableTalents({ 
        date: availForm.date, 
        startTime: availForm.startTime, 
        endTime: availForm.endTime 
      });
      setResults(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talent Directory & Search</h1>
        <p className="text-sm text-slate-600 mt-1">
          Search for performers across artistic disciplines or query real-time artist availability for events.
        </p>
      </div>

      {/* Clean Tab Switcher */}
      <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-sm">
        <button 
          onClick={() => { setTab('skill'); setResults([]); setSearched(false); }} 
          className={`px-4 py-1.5 rounded-md font-medium transition ${
            tab === 'skill' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Search by Skill
        </button>
        <button 
          onClick={() => { setTab('avail'); setResults([]); setSearched(false); }} 
          className={`px-4 py-1.5 rounded-md font-medium transition ${
            tab === 'avail' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Search by Availability
        </button>
      </div>

      <Alert type="error" message={error} />

      {tab === 'skill' && (
        <form onSubmit={handleSkillSearch} className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Skill Keyword
            </label>
            <input 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
              placeholder="e.g., Bharatanatyam, Guitar, Monoacting" 
              value={skillForm.skill} 
              onChange={(e) => setSkillForm({ ...skillForm, skill: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Activity Category
            </label>
            <select 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
              value={skillForm.category} 
              onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Proficiency Level
            </label>
            <select 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
              value={skillForm.proficiency} 
              onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l || 'Any Proficiency'}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3 pt-2">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2 rounded-md transition shadow-xs"
            >
              Search Talents
            </button>
          </div>
        </form>
      )}

      {tab === 'avail' && (
        <form onSubmit={handleAvailSearch} className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Required Date *
            </label>
            <input 
              type="date" 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
              value={availForm.date} 
              onChange={(e) => setAvailForm({ ...availForm, date: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              From Time *
            </label>
            <input 
              type="time" 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
              value={availForm.startTime} 
              onChange={(e) => setAvailForm({ ...availForm, startTime: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              To Time *
            </label>
            <input 
              type="time" 
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-600" 
              value={availForm.endTime} 
              onChange={(e) => setAvailForm({ ...availForm, endTime: e.target.value })} 
              required 
            />
          </div>
          <div className="sm:col-span-3 pt-2">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2 rounded-md transition shadow-xs"
            >
              Find Available Performers
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="py-8 text-center">
          <Spinner />
        </div>
      )}

      {!loading && searched && (
        results.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No matching participants found for your query. Try broadening your search filters.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Search Results ({results.length})
              </h2>
              <span className="text-xs text-slate-500">
                Sorted by profile relevance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    {tab === 'skill'
                      ? ['Name', 'Department', 'Year', 'Skill', 'Category', 'Proficiency', 'Experience', 'Portfolio'].map((h) => (
                          <th key={h} className="px-6 py-3">{h}</th>
                        ))
                      : ['Name', 'Email', 'Department', 'Year', 'Available Date', 'Start', 'End'].map((h) => (
                          <th key={h} className="px-6 py-3">{h}</th>
                        ))
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      {tab === 'skill' ? (
                        <>
                          <td className="px-6 py-3.5 font-medium text-slate-900">{r.full_name}</td>
                          <td className="px-6 py-3.5 text-slate-600">{r.department}</td>
                          <td className="px-6 py-3.5 text-slate-600">Yr {r.year_of_study}</td>
                          <td className="px-6 py-3.5 text-slate-900 font-medium">{r.skill_name}</td>
                          <td className="px-6 py-3.5 text-slate-600">{r.category}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${proficiencyStyles[r.proficiency_level] || 'bg-slate-100 text-slate-700'}`}>
                              {r.proficiency_level}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-700">{r.years_of_experience} yrs</td>
                          <td className="px-6 py-3.5">
                            {r.portfolio_url ? (
                              <a 
                                href={r.portfolio_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
                              >
                                View ↗
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3.5 font-medium text-slate-900">{r.full_name}</td>
                          <td className="px-6 py-3.5 text-slate-600">{r.email}</td>
                          <td className="px-6 py-3.5 text-slate-600">{r.department}</td>
                          <td className="px-6 py-3.5 text-slate-600">Yr {r.year_of_study}</td>
                          <td className="px-6 py-3.5 text-slate-900">{r.available_date?.split('T')[0] || r.available_date}</td>
                          <td className="px-6 py-3.5 text-slate-700">{r.start_time?.slice(0, 5)}</td>
                          <td className="px-6 py-3.5 text-slate-700">{r.end_time?.slice(0, 5)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

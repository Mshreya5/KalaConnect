import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Activities from './pages/Activities';
import MySkills from './pages/MySkills';
import Availability from './pages/Availability';
import TalentSearch from './pages/TalentSearch';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/participants" element={<Participants />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/skills" element={<MySkills />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/search" element={<TalentSearch />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

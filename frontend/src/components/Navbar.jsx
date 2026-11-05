import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/participants', label: 'Participants' },
  { to: '/activities', label: 'Activities' },
  { to: '/skills', label: 'My Skills' },
  { to: '/availability', label: 'Availability' },
  { to: '/search', label: 'Talent Search' },
];

export default function Navbar() {
  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
        <span className="font-bold text-lg tracking-wide mr-4">🎭 KalaConnect</span>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `text-sm px-3 py-1 rounded transition ${isActive ? 'bg-white text-indigo-700 font-semibold' : 'hover:bg-indigo-600'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

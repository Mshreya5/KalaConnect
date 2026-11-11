import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { role, setRole, currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const participantLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/profile', label: 'My Profile' },
    { to: '/skills', label: 'My Skills' },
    { to: '/availability', label: 'Availability' },
    { to: '/events', label: 'Events' },
  ];

  const organizerLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/events', label: 'Events' },
    { to: '/talent-matcher', label: 'Find Talents' },
    { to: '/participation', label: 'Registrations' },
  ];

  const navLinks = role === 'organizer' ? organizerLinks : participantLinks;

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight hover:text-indigo-600 transition">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                K
              </span>
              <span>KalaConnect</span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Header Area: Role Switcher & User Profile */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Simple Segmented Role Switcher */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setRole('participant')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  role === 'participant'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Participant
              </button>
              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  role === 'organizer'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Organizer
              </button>
            </div>

            {/* User Profile & Logout */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden lg:block leading-tight">
                  <div className="font-medium text-xs text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{role}</div>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-slate-500 truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(role === 'participant' ? '/profile' : '/events');
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    {role === 'participant' ? 'View Profile' : 'My Events'}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100 transition font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role View</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setRole('participant')}
                className={`px-3 py-1 rounded-md ${role === 'participant' ? 'bg-white font-semibold text-slate-900' : 'text-slate-600'}`}
              >
                Participant
              </button>
              <button
                onClick={() => setRole('organizer')}
                className={`px-3 py-1 rounded-md ${role === 'organizer' ? 'bg-white font-semibold text-slate-900' : 'text-slate-600'}`}
              >
                Organizer
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-medium text-slate-900 block">{currentUser.name}</span>
              <span className="text-slate-500 capitalize">{role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-rose-600 hover:text-rose-700"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

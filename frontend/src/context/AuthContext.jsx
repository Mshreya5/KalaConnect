import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('kalaconnect_role') || 'participant';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return role === 'organizer'
      ? { id: 1, name: 'Priya Patel', email: 'priya.patel@college.edu', title: 'Cultural Coordinator', role: 'organizer' }
      : { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@college.edu', department: 'Computer Science', role: 'participant' };
  });

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem('kalaconnect_role', newRole);
    if (newRole === 'organizer') {
      setCurrentUser({ id: 1, name: 'Priya Patel', email: 'priya.patel@college.edu', title: 'Cultural Coordinator', role: 'organizer' });
    } else {
      setCurrentUser({ id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@college.edu', department: 'Computer Science', role: 'participant' });
    }
  };

  const switchRole = () => {
    const nextRole = role === 'participant' ? 'organizer' : 'participant';
    setRole(nextRole);
  };

  const logout = () => {
    setRole('participant');
  };

  return (
    <AuthContext.Provider value={{ role, setRole, switchRole, currentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, UserPlus, Table, UserCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PersonInput from './components/PersonInput';
import BulkEntry from './components/BulkEntry';
import EditPerson from './components/EditPerson';

const CURRENT_USER = 'keshavkarn';

// Mock initial data with explicit System IDs
const initialLineage = [
  {
    id: 'a1B2c3D4',
    name: 'John Doe',
    dob: '1960-05-15',
    isPublic: true,
    createdBy: CURRENT_USER,
    parents: { primaryMother: null, primaryFather: null, others: [] },
    customFields: []
  },
  {
    id: 'e5F6g7H8',
    name: 'Jane Smith',
    dob: '1962-08-22',
    isPublic: true,
    createdBy: CURRENT_USER,
    parents: { primaryMother: null, primaryFather: null, others: [] },
    customFields: []
  },
  {
    id: 'i9J0k1L2',
    name: 'Michael Doe',
    dob: '1988-11-03',
    isPublic: true,
    createdBy: CURRENT_USER,
    parents: { 
      primaryMother: 'e5F6g7H8', 
      primaryFather: 'a1B2c3D4', 
      others: [] 
    },
    customFields: []
  }
];

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="app-bar-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
        <div className="d-flex align-center gap-2">
          <Users size={18} />
          <span>Dashboard</span>
        </div>
      </Link>
      <Link to="/add" className={location.pathname === '/add' ? 'active' : ''}>
        <div className="d-flex align-center gap-2">
          <UserPlus size={18} />
          <span>Add Person</span>
        </div>
      </Link>
      <Link to="/bulk" className={location.pathname === '/bulk' ? 'active' : ''}>
        <div className="d-flex align-center gap-2">
          <Table size={18} />
          <span>Bulk Entry</span>
        </div>
      </Link>
    </nav>
  );
}

function App() {
  const [people, setPeople] = useState(() => {
    const saved = localStorage.getItem('familyLineage');
    if (saved) {
      // Backfill missing, 'system', or hardcoded 'currentUser' createdBy fields to the current user
      const parsed = JSON.parse(saved);
      return parsed.map(p => ({
        ...p,
        createdBy: (!p.createdBy || p.createdBy === 'system' || p.createdBy === 'currentUser') ? CURRENT_USER : p.createdBy
      }));
    }
    return initialLineage;
  });

  useEffect(() => {
    localStorage.setItem('familyLineage', JSON.stringify(people));
  }, [people]);

  const addPerson = (person) => {
    setPeople([...people, person]);
  };

  const updatePerson = (updatedPerson) => {
    setPeople(people.map(p => p.id === updatedPerson.id ? updatedPerson : p));
  };

  const deletePerson = (id) => {
    setPeople(people.filter(p => p.id !== id));
  };

  const addPeopleBulk = (newPeople) => {
    setPeople([...people, ...newPeople]);
  };

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <header className="app-bar">
        <div className="d-flex align-center gap-4">
          <div className="app-bar-brand">
            <Users color="var(--primary-color)" />
            AncestryArc
          </div>
          <Navigation />
        </div>
        <div className="d-flex align-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <UserCircle size={18} />
          Logged in as <strong>{CURRENT_USER}</strong>
        </div>
      </header>

      <main className="container" style={{ maxWidth: '100%', padding: '0 16px' }}>
        <Routes>
          <Route path="/" element={<Dashboard people={people} onUpdate={updatePerson} onDelete={deletePerson} currentUser={CURRENT_USER} />} />
          <Route path="/add" element={<PersonInput people={people} onSave={addPerson} currentUser={CURRENT_USER} />} />
          <Route path="/edit/:id" element={<EditPerson people={people} onUpdate={updatePerson} currentUser={CURRENT_USER} />} />
          <Route path="/bulk" element={<BulkEntry onAddBulk={addPeopleBulk} currentUser={CURRENT_USER} people={people} />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;

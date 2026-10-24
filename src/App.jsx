import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, UserPlus, Table, UserCircle, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Dashboard from './components/Dashboard';
import PersonInput from './components/PersonInput';
import BulkEntry from './components/BulkEntry';
import EditPerson from './components/EditPerson';
import defaultFamilyData from './data/defaultFamilyData.json';

const CURRENT_USER = 'keshavkarn';

// Mock initial data populated with default 39-member village dataset
const initialLineage = defaultFamilyData;

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="app-bar-nav">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
        <div className="d-flex align-center gap-2">
          <Users size={16} />
          <span>Dashboard</span>
        </div>
      </Link>
      <Link to="/add" className={location.pathname === '/add' ? 'active' : ''}>
        <div className="d-flex align-center gap-2">
          <UserPlus size={16} />
          <span>Add Person</span>
        </div>
      </Link>
      <Link to="/bulk" className={location.pathname === '/bulk' ? 'active' : ''}>
        <div className="d-flex align-center gap-2">
          <Table size={16} />
          <span>Bulk Entry</span>
        </div>
      </Link>
    </nav>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

function AnimatedRoutes({ people, addPerson, updatePerson, deletePerson, addPeopleBulk, onImportPeople }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard people={people} onUpdate={updatePerson} onDelete={deletePerson} onImportPeople={onImportPeople} currentUser={CURRENT_USER} />} />
          <Route path="/add" element={<PersonInput people={people} onSave={addPerson} currentUser={CURRENT_USER} />} />
          <Route path="/edit/:id" element={<EditPerson people={people} onUpdate={updatePerson} currentUser={CURRENT_USER} />} />
          <Route path="/bulk" element={<BulkEntry onAddBulk={addPeopleBulk} currentUser={CURRENT_USER} people={people} />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="app-bar-brand">
              <Users color="var(--primary-color)" size={22} />
              AncestryArc
            </div>
          </Link>
          <Navigation />
        </div>
        <div className="d-flex align-center gap-3">
          <div className="d-flex align-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '6px 14px', borderRadius: '10px', background: 'var(--primary-light)' }}>
            <UserCircle size={16} color="var(--primary-color)" />
            <span style={{ fontWeight: 500 }}>{CURRENT_USER}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '100%', padding: '20px 24px' }}>
        <AnimatedRoutes
          people={people}
          addPerson={addPerson}
          updatePerson={updatePerson}
          deletePerson={deletePerson}
          addPeopleBulk={addPeopleBulk}
          onImportPeople={setPeople}
        />
      </main>
    </Router>
  );
}

export default App;

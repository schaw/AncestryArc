import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, UserPlus, Table, UserCircle, LogIn, LogOut, Cloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Dashboard from './components/Dashboard';
import PersonInput from './components/PersonInput';
import BulkEntry from './components/BulkEntry';
import EditPerson from './components/EditPerson';
import defaultFamilyData from './data/defaultFamilyData.json';
import { AuthProvider, useAuth } from './firebase/authContext';
import { 
  subscribeToFamilyLineage, 
  savePersonToFirestore, 
  deletePersonFromFirestore, 
  uploadFullTreeToFirestore 
} from './firebase/firestoreService';

const DEFAULT_USER = 'keshavkarn';

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

function AnimatedRoutes({ people, addPerson, updatePerson, deletePerson, addPeopleBulk, onImportPeople, activeUser }) {
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
          <Route path="/" element={<Dashboard people={people} onUpdate={updatePerson} onDelete={deletePerson} onImportPeople={onImportPeople} currentUser={activeUser} />} />
          <Route path="/add" element={<PersonInput people={people} onSave={addPerson} currentUser={activeUser} />} />
          <Route path="/edit/:id" element={<EditPerson people={people} onUpdate={updatePerson} currentUser={activeUser} />} />
          <Route path="/bulk" element={<BulkEntry onAddBulk={addPeopleBulk} currentUser={activeUser} people={people} />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { user, loginWithGoogle, logout, isFirebaseConfigured } = useAuth();
  const activeUser = user?.displayName || user?.email || DEFAULT_USER;

  const [people, setPeople] = useState(() => {
    const saved = localStorage.getItem('familyLineage');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically upgrade if localStorage only contains the legacy 3 mock people (John Doe, Jane Smith, Michael Doe)
        const isLegacyMock = Array.isArray(parsed) && parsed.length <= 3 && parsed.some(p => p.id === 'a1B2c3D4' || p.name === 'John Doe');
        if (!isLegacyMock && Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            createdBy: (!p.createdBy || p.createdBy === 'system' || p.createdBy === 'currentUser') ? activeUser : p.createdBy
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved family lineage', e);
      }
    }
    return initialLineage;
  });

  // Local storage mirror backup
  useEffect(() => {
    localStorage.setItem('familyLineage', JSON.stringify(people));
  }, [people]);

  // Real-time Firestore synchronization
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToFamilyLineage((cloudPeople) => {
      if (cloudPeople && cloudPeople.length > 0) {
        setPeople(cloudPeople);
      } else if (user) {
        // First-time sync: if Firestore is empty, auto-seed with current 39 family members!
        uploadFullTreeToFirestore(people, user);
      }
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured, user]);

  const addPerson = async (person) => {
    setPeople(prev => [...prev, person]);
    if (isFirebaseConfigured) {
      await savePersonToFirestore(person, user);
    }
  };

  const updatePerson = async (updatedPerson) => {
    setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
    if (isFirebaseConfigured) {
      await savePersonToFirestore(updatedPerson, user);
    }
  };

  const deletePerson = async (id) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    if (isFirebaseConfigured) {
      await deletePersonFromFirestore(id);
    }
  };

  const addPeopleBulk = async (newPeople) => {
    setPeople(prev => [...prev, ...newPeople]);
    if (isFirebaseConfigured) {
      await uploadFullTreeToFirestore([...people, ...newPeople], user);
    }
  };

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <header className="app-bar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="app-bar-brand">
            <Users color="var(--primary-color)" size={22} />
            AncestryArc
          </div>
        </Link>

        <Navigation />
        
        {/* User Account / Google Login Header Item */}
        <div className="d-flex align-center gap-2">
          {user ? (
            <div className="d-flex align-center gap-2" style={{ background: 'var(--surface-color)', padding: '3px 8px', borderRadius: '20px', border: '1px solid var(--border-color)', maxWidth: '180px' }}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid var(--primary-color)', flexShrink: 0 }} 
                />
              ) : (
                <UserCircle size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.displayName}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                  <Cloud size={9} /> Sync
                </span>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-text" 
                style={{ padding: '2px 4px', fontSize: '0.75rem', color: 'var(--text-hint)' }}
                title="Log out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle} 
              className="btn btn-outline" 
              style={{ 
                padding: '5px 12px', 
                fontSize: '0.78rem', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                whiteSpace: 'nowrap'
              }}
              title={isFirebaseConfigured ? "Sign in with Google" : "Setup Firebase in .env to enable Google Login"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isFirebaseConfigured ? 'Sign in' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '100%', padding: '16px 20px' }}>
        <AnimatedRoutes
          people={people}
          addPerson={addPerson}
          updatePerson={updatePerson}
          deletePerson={deletePerson}
          addPeopleBulk={addPeopleBulk}
          onImportPeople={setPeople}
          activeUser={activeUser}
        />
      </main>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

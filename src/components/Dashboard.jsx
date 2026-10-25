import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Download, Users, Layers, GitFork, MapPin, Plus, X, Maximize2, Minimize2, BarChart2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalGraph from './GlobalGraph';
import LineageTree from './LineageTree';
import { useAuth } from '../firebase/authContext';
import { getMaskedName } from '../utils/masking';

export default function Dashboard({ people, onUpdate, onDelete, onImportPeople, currentUser }) {
  const { user, loginWithGoogle } = useAuth();
  const isLoggedIn = Boolean(user);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [activeView, setActiveView] = useState('web');
  const [isGenerational, setIsGenerational] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const searchContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to Escape key to exit maximized mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  // Family Stats calculation
  const stats = useMemo(() => {
    const totalPeople = people.length;
    if (totalPeople === 0) {
      return { totalPeople: 0, generations: 0, relationships: 0, origins: 0 };
    }

    const depthMap = {};
    const getDepth = (id, visited = new Set()) => {
      if (visited.has(id)) return 1;
      if (depthMap[id] !== undefined) return depthMap[id];
      visited.add(id);
      const p = people.find(x => x.id === id);
      if (!p || !p.parents) return 1;
      const parentDepths = [0];
      if (p.parents.primaryMother) parentDepths.push(getDepth(p.parents.primaryMother, new Set(visited)));
      if (p.parents.primaryFather) parentDepths.push(getDepth(p.parents.primaryFather, new Set(visited)));
      p.parents.others?.forEach(o => parentDepths.push(getDepth(o.id, new Set(visited))));
      const d = 1 + Math.max(...parentDepths);
      depthMap[id] = d;
      return d;
    };

    let maxGen = 0;
    people.forEach(p => {
      const d = getDepth(p.id);
      if (d > maxGen) maxGen = d;
    });

    let relationships = 0;
    const spousePairs = new Set();
    people.forEach(p => {
      if (p.parents?.primaryMother) relationships++;
      if (p.parents?.primaryFather) relationships++;
      if (p.parents?.others?.length) relationships += p.parents.others.length;
      if (p.spouse) {
        const pair = [p.id, p.spouse].sort().join('::');
        spousePairs.add(pair);
      }
    });
    relationships += spousePairs.size;

    const origins = new Set(
      people
        .map(p => p.ancestralVillage?.trim())
        .filter(Boolean)
    ).size;

    return {
      totalPeople,
      generations: maxGen || 1,
      relationships,
      origins
    };
  }, [people]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return people.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.id.toLowerCase().includes(lowerQuery) ||
      (p.ancestralVillage && p.ancestralVillage.toLowerCase().includes(lowerQuery))
    ).slice(0, 6);
  }, [people, searchQuery]);

  const handleSelectSearchResult = (id) => {
    setSelectedPersonId(id);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleExportAllCsv = () => {
    if (!isLoggedIn) {
      loginWithGoogle();
      return;
    }
    if (!people || people.length === 0) return;

    const headers = [
      'id', 'name', 'displayName', 'nickname', 'dob', 'height', 'race', 'gender', 'spouse', 'spouseStartDate',
      'address', 'ancestralVillage', 'notes', 'isPublic', 'createdBy', 'primaryMother', 'primaryFather'
    ];
    
    const rows = people.map(p => {
      return headers.map(header => {
        if (header === 'primaryMother') return p.parents?.primaryMother || '';
        if (header === 'primaryFather') return p.parents?.primaryFather || '';
        let val = p[header] || '';
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
        }
        return val;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ancestry_arc_family_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportAllJson = () => {
    if (!isLoggedIn) {
      loginWithGoogle();
      return;
    }
    if (!people || people.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(people, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ancestry_arc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJsonFile = (e) => {
    if (!isLoggedIn) {
      loginWithGoogle();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportPeople?.(parsed);
          alert(`Successfully loaded ${parsed.length} family members!`);
        } else {
          alert('Invalid file format: JSON must be an array of people.');
        }
      } catch (err) {
        alert('Could not parse the selected JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Sleek, Responsive Main Toolbar */}
      <div 
        className="dashboard-toolbar"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '10px',
          background: 'var(--surface-color)',
          padding: '10px 16px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--elevation-1)'
        }}
      >
        {/* Left: View Switcher Tabs + Generational Toggle */}
        <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!selectedPersonId ? (
            <div className="tab-bar">
              <button 
                className={`tab ${activeView === 'web' ? 'active' : ''}`}
                onClick={() => setActiveView('web')}
              >
                Global Web
              </button>
              <button 
                className={`tab ${activeView === 'tree' ? 'active' : ''}`}
                onClick={() => setActiveView('tree')}
              >
                Full Lineage Tree
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Focused Lineage</span>
              <span style={{ color: 'var(--text-hint)', fontSize: '0.8rem' }}>
                ({(() => {
                  const p = people.find(x => x.id === selectedPersonId);
                  if (!p) return selectedPersonId;
                  const rawName = p.displayName?.trim() ? p.displayName.trim() : p.name;
                  return isLoggedIn ? rawName : getMaskedName(rawName, false);
                })()})
              </span>
            </div>
          )}

          {activeView === 'web' && !selectedPersonId && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '4px 10px', 
                background: 'var(--background-color)', 
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Generational Gravity:
              </span>
              <button 
                type="button"
                className={`toggle-switch ${isGenerational ? 'active' : ''}`}
                onClick={() => setIsGenerational(!isGenerational)}
                title="Toggle generational gravity"
                aria-label="Toggle generational layering"
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isGenerational ? 'var(--primary-color)' : 'var(--text-hint)' }}>
                {isGenerational ? 'ON' : 'OFF'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Minimalist Stats Capsule */}
        {people.length > 0 && (
          <div 
            className="toolbar-center"
            onClick={() => setShowStatsDrawer(!showStatsDrawer)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '6px 14px', 
              borderRadius: '20px', 
              background: 'var(--background-color)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
            title="Click to view detailed metrics breakdown"
          >
            <BarChart2 size={15} color="var(--primary-color)" style={{ flexShrink: 0 }} />
            <span><strong style={{ color: 'var(--text-primary)' }}>{stats.totalPeople}</strong> Members</span>
            <span>•</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{stats.generations}</strong> Gen</span>
            <span>•</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{stats.relationships}</strong> Links</span>
          </div>
        )}

        {/* Right: Actions & Maximize Control */}
        <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Dropdown */}
          <div ref={searchContainerRef} className="toolbar-search" style={{ position: 'relative', minWidth: '180px', flex: '1 1 auto' }}>
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--background-color)', 
                borderRadius: '10px', 
                padding: '6px 10px', 
                border: '1px solid var(--border-color)',
                width: '100%'
              }}
            >
              <Search size={15} color="var(--text-secondary)" style={{ marginRight: '6px', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Find member..." 
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  background: 'transparent', 
                  width: '100%', 
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-hint)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {isSearchOpen && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 6px)', 
                    right: 0, 
                    width: '300px', 
                    backgroundColor: 'var(--surface-color)', 
                    boxShadow: 'var(--elevation-3)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    zIndex: 100, 
                    overflow: 'hidden' 
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-hint)', borderBottom: '1px solid var(--border-color)' }}>
                    MATCHING MEMBERS ({searchResults.length})
                  </div>
                  {searchResults.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectSearchResult(p.id)}
                      style={{ 
                        padding: '9px 12px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {isLoggedIn ? (p.displayName || p.name) : getMaskedName(p.displayName || p.name, false)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-hint)', background: 'var(--background-color)', padding: '2px 5px', borderRadius: '4px' }}>
                          {p.id}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {isLoggedIn ? (
                          <>
                            {p.dob ? `Born ${p.dob}` : 'Birth date unknown'}
                            {p.ancestralVillage ? ` • ${p.ancestralVillage}` : ''}
                          </>
                        ) : (
                          'Member (Initials Only)'
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Add */}
          <Link 
            to="/add" 
            className="btn btn-primary" 
            style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: '10px' }}
            title="Add Person"
          >
            <Plus size={15} />
            <span>Add</span>
          </Link>

          {/* Export JSON Backup */}
          {!selectedPersonId && people.length > 0 && (
            <button 
              className="btn btn-outline" 
              style={{ 
                borderRadius: '10px', 
                padding: '7px 10px', 
                fontSize: '0.8rem',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }} 
              title="Export Full JSON Backup" 
              onClick={handleExportAllJson}
            >
              <Download size={15} color="var(--primary-color)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>JSON</span>
            </button>
          )}

          {/* Export CSV */}
          {!selectedPersonId && people.length > 0 && (
            <button 
              className="btn btn-outline" 
              style={{ 
                borderRadius: '10px', 
                padding: '7px 10px', 
                fontSize: '0.8rem',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }} 
              title="Export all members to CSV" 
              onClick={handleExportAllCsv}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>CSV</span>
            </button>
          )}

          {/* Import JSON File */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".json" 
            onChange={handleImportJsonFile} 
            style={{ display: 'none' }} 
          />
          <button 
            type="button"
            className="btn btn-outline"
            style={{ 
              borderRadius: '10px', 
              padding: '7px 10px', 
              fontSize: '0.8rem',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title="Import/Restore JSON Tree"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} />
          </button>

          {/* Maximize Fullscreen Canvas Toggle */}
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setIsMaximized(!isMaximized)}
            style={{ 
              borderRadius: '10px', 
              padding: '7px 10px', 
              fontSize: '0.8rem',
              borderColor: 'var(--border-color)',
              color: isMaximized ? 'var(--primary-color)' : 'var(--text-secondary)',
              background: isMaximized ? 'var(--primary-light)' : 'transparent'
            }}
            title={isMaximized ? "Exit Fullscreen (Esc)" : "Maximize Flow (Fullscreen)"}
            aria-label="Maximize graph view"
          >
            {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Optional Collapsible Stats Drawer */}
      <AnimatePresence>
        {showStatsDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '12px',
              padding: '12px 0'
            }}>
              <div className="stat-card" style={{ padding: '14px 18px' }}>
                <div className="stat-icon" style={{ width: '32px', height: '32px', marginBottom: '6px' }}><Users size={16} /></div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stats.totalPeople}</div>
                <div className="stat-label">Total Members</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 18px' }}>
                <div className="stat-icon" style={{ width: '32px', height: '32px', marginBottom: '6px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--secondary-color)' }}><Layers size={16} /></div>
                <div className="stat-value" style={{ fontSize: '1.5rem', backgroundImage: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>{stats.generations}</div>
                <div className="stat-label">Generations Depth</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 18px' }}>
                <div className="stat-icon" style={{ width: '32px', height: '32px', marginBottom: '6px', background: 'rgba(244, 114, 182, 0.12)', color: 'var(--accent-color)' }}><GitFork size={16} /></div>
                <div className="stat-value" style={{ fontSize: '1.5rem', backgroundImage: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' }}>{stats.relationships}</div>
                <div className="stat-label">Kinship Connections</div>
              </div>
              <div className="stat-card" style={{ padding: '14px 18px' }}>
                <div className="stat-icon" style={{ width: '32px', height: '32px', marginBottom: '6px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-color)' }}><MapPin size={16} /></div>
                <div className="stat-value" style={{ fontSize: '1.5rem', backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>{stats.origins}</div>
                <div className="stat-label">Ancestral Villages</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Graph / Tree Container: Full Width & Immersive */}
      {people.length === 0 ? (
        <div className="card-glass text-center" style={{ padding: '64px 24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Start Your Family Heritage</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px' }}>
            No family members have been added yet. Add your first member or import records in bulk.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link to="/add" className="btn btn-primary">
              <Plus size={16} /> Add First Member
            </Link>
            <Link to="/bulk" className="btn btn-outline">
              Bulk Spreadsheet Entry
            </Link>
          </div>
        </div>
      ) : (
        <div 
          style={{
            position: isMaximized ? 'fixed' : 'relative',
            top: isMaximized ? 0 : 'auto',
            left: isMaximized ? 0 : 'auto',
            width: isMaximized ? '100vw' : '100%',
            height: isMaximized ? '100vh' : 'calc(100vh - 145px)',
            zIndex: isMaximized ? 1000 : 1,
            backgroundColor: 'var(--background-color)',
            borderRadius: isMaximized ? 0 : '16px',
            border: isMaximized ? 'none' : '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: isMaximized ? 'none' : 'var(--elevation-2)',
            transition: 'all 0.25s ease'
          }}
        >
          {/* In Maximized Mode, provide a floating Exit Maximize pill */}
          {isMaximized && (
            <div 
              style={{ 
                position: 'absolute', 
                top: 14, 
                right: 14, 
                zIndex: 100, 
                display: 'flex', 
                gap: '8px' 
              }}
            >
              <button 
                onClick={() => setIsMaximized(false)}
                className="btn btn-primary"
                style={{ 
                  borderRadius: '24px', 
                  padding: '8px 16px', 
                  boxShadow: 'var(--elevation-3)',
                  fontSize: '0.8rem'
                }}
              >
                <Minimize2 size={15} /> Exit Fullscreen (Esc)
              </button>
            </div>
          )}

          {selectedPersonId ? (
            <LineageTree 
              people={people} 
              rootId={selectedPersonId} 
              onBack={() => setSelectedPersonId(null)}
              onNodeClick={setSelectedPersonId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              currentUser={currentUser}
            />
          ) : activeView === 'tree' ? (
            <LineageTree 
              people={people} 
              rootId={null} 
              onBack={() => {}}
              onNodeClick={setSelectedPersonId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              currentUser={currentUser}
            />
          ) : (
            <GlobalGraph 
              people={people} 
              viewMode={isGenerational ? 'generational' : 'web'}
              onNodeClick={setSelectedPersonId}
            />
          )}
        </div>
      )}
    </div>
  );
}

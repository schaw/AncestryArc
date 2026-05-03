import React, { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import GlobalGraph from './GlobalGraph';
import LineageTree from './LineageTree';

export default function Dashboard({ people, onUpdate, onDelete, currentUser }) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [activeView, setActiveView] = useState('web');
  const [isGenerational, setIsGenerational] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return people.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.id.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Limit to top 5 results
  }, [people, searchQuery]);

  const handleSelectSearchResult = (id) => {
    setSelectedPersonId(id);
    setSearchQuery('');
  };

  const handleExportAllCsv = () => {
    if (!people || people.length === 0) return;

    const headers = ['id', 'name', 'dob', 'height', 'race', 'gender', 'spouse', 'spouseStartDate', 'address', 'ancestralVillage', 'notes', 'isPublic', 'createdBy', 'primaryMother', 'primaryFather'];
    
    const rows = people.map(p => {
      return headers.map(header => {
        if (header === 'primaryMother') return p.parents?.primaryMother || '';
        if (header === 'primaryFather') return p.parents?.primaryFather || '';
        let val = p[header] || '';
        // Escape quotes
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
    link.setAttribute("download", "ancestry_arc_all_people.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <div className="d-flex align-center justify-between mb-4">
        <h2 style={{ margin: 0 }}>
          {selectedPersonId ? 'Lineage Tree' : 'Global Views'}
        </h2>
        
        <div className="d-flex align-center gap-4">
          {!selectedPersonId && (
            <button 
              className="btn btn-outline" 
              style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              title="Export all" 
              onClick={handleExportAllCsv}
            >
              <Download size={18} />
            </button>
          )}
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '300px' }}>
          <div className="d-flex align-center" style={{ backgroundColor: 'var(--surface-color)', borderRadius: '24px', padding: '8px 16px', boxShadow: 'var(--elevation-1)' }}>
            <Search size={18} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', color: 'var(--text-primary)' }}
            />
          </div>
          
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'var(--surface-color)', boxShadow: 'var(--elevation-2)', borderRadius: '12px', marginTop: '8px', zIndex: 100, overflow: 'hidden' }}>
              {searchResults.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleSelectSearchResult(p.id)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(98,0,234,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: '500' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {p.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
      
      {!selectedPersonId && (
        <div className="d-flex align-center gap-4 mb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button className="btn btn-text" style={{ padding: '8px 16px', borderBottom: activeView === 'web' ? '2px solid var(--primary-color)' : 'none', borderRadius: 0, fontWeight: activeView === 'web' ? 'bold' : 'normal', color: activeView === 'web' ? 'var(--primary-color)' : 'var(--text-secondary)' }} onClick={() => setActiveView('web')}>Global Web</button>
          <button className="btn btn-text" style={{ padding: '8px 16px', borderBottom: activeView === 'tree' ? '2px solid var(--primary-color)' : 'none', borderRadius: 0, fontWeight: activeView === 'tree' ? 'bold' : 'normal', color: activeView === 'tree' ? 'var(--primary-color)' : 'var(--text-secondary)' }} onClick={() => setActiveView('tree')}>Full Lineage Tree</button>
          
          {activeView === 'web' && (
            <div className="d-flex align-center gap-2" style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generational Layering:</span>
              <button 
                className={`btn ${isGenerational ? 'btn-primary' : 'btn-outline'}`} 
                style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem' }}
                onClick={() => setIsGenerational(!isGenerational)}
              >
                {isGenerational ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {people.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No family members added yet. Start by adding people or use Bulk Entry.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
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

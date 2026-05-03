import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import GlobalGraph from './GlobalGraph';
import LineageTree from './LineageTree';

export default function Dashboard({ people, onUpdate, onDelete, currentUser }) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
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

  return (
    <div>
      <div className="d-flex align-center justify-between mb-4">
        <h2 style={{ margin: 0 }}>
          {selectedPersonId ? 'Lineage Tree' : 'Global Web of People'}
        </h2>
        
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
          ) : (
            <GlobalGraph 
              people={people} 
              onNodeClick={setSelectedPersonId}
            />
          )}
        </div>
      )}
    </div>
  );
}

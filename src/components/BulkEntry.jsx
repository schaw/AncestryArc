import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Undo2, Save, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateUniqueId } from '../utils/generateId';

const createEmptyRow = (index) => ({
  tempId: `#T${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
  name: '',
  dob: '',
  height: '',
  race: '',
  phone: '',
  email: '',
  nationalId: '',
  primaryMother: '',
  primaryFather: '',
  otherAttributes: '' 
});

export default function BulkEntry({ onAddBulk, currentUser }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => Array.from({ length: 20 }, (_, i) => createEmptyRow(i)));
  const [deletedRow, setDeletedRow] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    return () => {
      if (undoTimeout) clearTimeout(undoTimeout);
    };
  }, [undoTimeout]);

  const handleInputChange = (tempId, field, value) => {
    setRows(rows.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (tempId, index) => {
    const rowToDelete = rows.find(r => r.tempId === tempId);
    const newRows = rows.filter(r => r.tempId !== tempId);
    newRows.push(createEmptyRow());
    setRows(newRows);
    
    setDeletedRow({ row: rowToDelete, originalIndex: index });
    
    if (undoTimeout) clearTimeout(undoTimeout);
    
    const timeout = setTimeout(() => {
      setDeletedRow(null); 
    }, 5000);
    setUndoTimeout(timeout);
  };

  const handleUndo = () => {
    if (!deletedRow) return;
    if (undoTimeout) clearTimeout(undoTimeout);
    
    const newRows = [...rows];
    newRows.pop();
    newRows.splice(deletedRow.originalIndex, 0, deletedRow.row);
    
    setRows(newRows);
    setDeletedRow(null);
  };

  const handleSave = () => {
    const validRows = rows.filter(r => r.name.trim() !== '');
    
    // 1. Generate real IDs for all valid rows
    const idMap = {}; // tempId -> realId
    const processedRows = validRows.map(row => {
      const realId = generateUniqueId();
      idMap[row.tempId] = realId;
      return { ...row, realId };
    });

    // 2. Map Temp IDs in parent references to Real IDs
    const mappedPeople = processedRows.map(r => {
      const customFields = [];
      if (r.phone) customFields.push({ key: 'Phone', value: r.phone });
      if (r.email) customFields.push({ key: 'Email', value: r.email });
      if (r.nationalId) customFields.push({ key: 'National ID', value: r.nationalId });
      if (r.otherAttributes) customFields.push({ key: 'Other', value: r.otherAttributes });

      // Resolve parent IDs (could be Temp IDs or actual Real IDs inputted directly)
      const resolveParentId = (val) => {
        if (!val) return null;
        const trimmed = val.trim();
        return idMap[trimmed] || trimmed; 
      };

      return {
        id: r.realId,
        name: r.name,
        dob: r.dob,
        height: r.height,
        race: r.race,
        isPublic: true,
        createdBy: currentUser,
        parents: { 
          primaryMother: resolveParentId(r.primaryMother), 
          primaryFather: resolveParentId(r.primaryFather), 
          others: [] 
        },
        customFields
      };
    });

    if (mappedPeople.length > 0) {
      onAddBulk(mappedPeople);
      navigate('/');
    }
  };

  const inputStyle = { padding: '8px', minWidth: '120px' };

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="d-flex align-center justify-between mb-4">
        <h2>Bulk Entry</h2>
        <button onClick={handleSave} className="btn btn-primary">
          <Save size={18} /> Save All Valid Rows
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        You can copy a row's <strong>Temp ID</strong> and paste it into another row's <strong>Mother ID</strong> or <strong>Father ID</strong> column. 
        When you save, the system will automatically generate real System IDs and link them up correctly!
      </p>

      <div className="card" style={{ overflowX: 'auto', padding: '0', whiteSpace: 'nowrap' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
              <th style={{ padding: '16px' }}>Temp ID</th>
              <th style={{ padding: '16px' }}>Name *</th>
              <th style={{ padding: '16px' }}>Mother ID</th>
              <th style={{ padding: '16px' }}>Father ID</th>
              <th style={{ padding: '16px' }}>DOB</th>
              <th style={{ padding: '16px' }}>Height</th>
              <th style={{ padding: '16px' }}>Race</th>
              <th style={{ padding: '16px' }}>Phone</th>
              <th style={{ padding: '16px' }}>Email</th>
              <th style={{ padding: '16px' }}>National ID</th>
              <th style={{ padding: '16px' }}>Other Attributes</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {rows.map((row, index) => (
                <motion.tr 
                  key={row.tempId}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    <div className="d-flex align-center gap-2">
                      {row.tempId}
                      <button 
                        onClick={() => copyToClipboard(row.tempId)}
                        className="btn btn-text"
                        style={{ padding: '4px', color: copiedId === row.tempId ? 'green' : 'var(--text-secondary)' }}
                        title="Copy Temp ID"
                      >
                        {copiedId === row.tempId ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.name} onChange={(e) => handleInputChange(row.tempId, 'name', e.target.value)} placeholder="Full Name" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.primaryMother} onChange={(e) => handleInputChange(row.tempId, 'primaryMother', e.target.value)} placeholder="ID or Temp ID" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.primaryFather} onChange={(e) => handleInputChange(row.tempId, 'primaryFather', e.target.value)} placeholder="ID or Temp ID" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="date" className="form-control" style={inputStyle} value={row.dob} onChange={(e) => handleInputChange(row.tempId, 'dob', e.target.value)} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.height} onChange={(e) => handleInputChange(row.tempId, 'height', e.target.value)} placeholder="Height" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.race} onChange={(e) => handleInputChange(row.tempId, 'race', e.target.value)} placeholder="Race" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.phone} onChange={(e) => handleInputChange(row.tempId, 'phone', e.target.value)} placeholder="Phone" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="email" className="form-control" style={inputStyle} value={row.email} onChange={(e) => handleInputChange(row.tempId, 'email', e.target.value)} placeholder="Email" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.nationalId} onChange={(e) => handleInputChange(row.tempId, 'nationalId', e.target.value)} placeholder="Nat. ID" />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="text" className="form-control" style={inputStyle} value={row.otherAttributes} onChange={(e) => handleInputChange(row.tempId, 'otherAttributes', e.target.value)} placeholder="e.g. Loc: NY" />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(row.tempId, index)}
                      className="btn btn-text"
                      style={{ color: 'var(--error-color)', padding: '8px' }}
                      title="Delete Row"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {deletedRow && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: 'var(--on-surface)', color: 'var(--surface-color)', padding: '12px 24px',
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1000
            }}
          >
            <span>Row deleted</span>
            <button 
              onClick={handleUndo}
              style={{ background: 'transparent', border: 'none', color: 'var(--secondary-color)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1rem' }}
            >
              <Undo2 size={16} /> Undo
            </button>
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', backgroundColor: 'var(--secondary-color)', width: '100%', animation: 'shrink 5s linear forwards' }} />
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
}

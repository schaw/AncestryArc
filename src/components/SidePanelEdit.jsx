import React, { useState, useEffect, useMemo } from 'react';
import { Save, X, Trash2, Plus, Copy, Check, ClipboardPaste } from 'lucide-react';

const ParentIdInput = ({ value, onChange, disabled, placeholder }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="d-flex align-center gap-2">
      <input type="text" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      {value ? (
        <button type="button" onClick={handleCopy} className="btn btn-text" style={{ padding: '8px', minWidth: 'auto', color: copied ? 'green' : 'var(--primary-color)' }} title="Copy ID">
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      ) : (
        <button type="button" onClick={handlePaste} className="btn btn-text" style={{ padding: '8px', minWidth: 'auto', color: 'var(--primary-color)' }} title="Paste ID" disabled={disabled}>
          <ClipboardPaste size={18} />
        </button>
      )}
    </div>
  );
};

export default function SidePanelEdit({ person, people = [], onSave, onDiscard, onDelete, currentUser }) {
  const isOwner = person.createdBy === currentUser;
  const [copiedId, setCopiedId] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const [saveStatus, setSaveStatus] = useState(null);
  const [formData, setFormData] = useState({
    id: '', name: '', dob: '', height: '', race: '', gender: '', spouse: '', spouseStartDate: '', address: '', isPublic: true,
  });

  const [parents, setParents] = useState({ primaryMother: '', primaryFather: '', others: [] });
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    if (person) {
      setFormData({
        id: person.id,
        name: person.name || '',
        dob: person.dob || '',
        height: person.height || '',
        race: person.race || '',
        gender: person.gender || '',
        spouse: person.spouse || '',
        spouseStartDate: person.spouseStartDate || '',
        address: person.address || '',
        isPublic: person.isPublic !== false,
      });
      setParents({
        primaryMother: person.parents?.primaryMother || '',
        primaryFather: person.parents?.primaryFather || '',
        others: person.parents?.others || []
      });
      setCustomFields(person.customFields || []);
    }
  }, [person]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleParentChange = (name, value) => {
    setParents(prev => ({ ...prev, [name]: value }));
  };

  const addCustomField = () => setCustomFields([...customFields, { key: '', value: '' }]);
  const removeCustomField = (index) => setCustomFields(customFields.filter((_, i) => i !== index));
  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleSave = () => {
    if (!formData.name) return;
    setSaveStatus('saving');

    const validCustomFields = customFields.filter(f => f.key.trim() !== '' && f.value.trim() !== '');
    const validOthers = parents.others.filter(o => o.id.trim() !== '');

    const updatedData = {
      ...formData,
      createdBy: person.createdBy,
      parents: {
        primaryMother: parents.primaryMother.trim() || null,
        primaryFather: parents.primaryFather.trim() || null,
        others: validOthers
      },
      customFields: validCustomFields
    };

    setTimeout(() => {
      onSave(updatedData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1500);
    }, 300);
  };

  const suggestedSpouses = useMemo(() => {
    if (!person || !people.length) return [];
    const children = people.filter(p => p.parents && (p.parents.primaryMother === person.id || p.parents.primaryFather === person.id));
    const coParents = new Set();
    children.forEach(c => {
      if (c.parents.primaryMother && c.parents.primaryMother !== person.id) coParents.add(c.parents.primaryMother);
      if (c.parents.primaryFather && c.parents.primaryFather !== person.id) coParents.add(c.parents.primaryFather);
    });
    return Array.from(coParents).filter(id => id !== formData.spouse);
  }, [person, people, formData.spouse]);

  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, width: '400px', maxHeight: 'calc(100vh - 170px)',
      overflowY: 'auto', backgroundColor: 'var(--surface-color)', padding: '20px',
      borderRadius: '12px', boxShadow: 'var(--elevation-3)', zIndex: 20
    }}>
      <div className="d-flex justify-between align-center mb-4">
        <h3 style={{ margin: 0 }}>Edit Person</h3>
        <button onClick={onDiscard} className="btn btn-text" style={{ padding: '4px', minWidth: 'auto' }}>
          <X size={18} />
        </button>
      </div>

      {!isOwner && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(255,0,0,0.1)', color: 'var(--error-color)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
          <strong>View Only:</strong> You did not create this record.
        </div>
      )}

      <div className="form-group">
        <label className="form-label">System ID</label>
        <div className="d-flex align-center gap-2">
          <input type="text" className="form-control" value={formData.id} disabled style={{ backgroundColor: 'var(--background-color)', opacity: 0.7 }} />
          <button 
            type="button"
            onClick={copyToClipboard}
            className="btn btn-text"
            style={{ padding: '8px', minWidth: 'auto', color: copiedId ? 'green' : 'var(--primary-color)' }}
            title="Copy System ID"
          >
            {copiedId ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary)' }}>
          Created By: <strong>{person.createdBy}</strong>
        </small>
      </div>

      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} disabled={!isOwner} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">DOB</label>
          <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} disabled={!isOwner} />
        </div>
        <div className="form-group">
          <label className="form-label">Height</label>
          <input type="text" name="height" className="form-control" value={formData.height} onChange={handleChange} disabled={!isOwner} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Race</label>
        <input type="text" name="race" className="form-control" value={formData.race} onChange={handleChange} disabled={!isOwner} />
      </div>

      <div className="form-group">
        <label className="form-label">Gender</label>
        <select name="gender" className="form-control" value={formData.gender} onChange={handleChange} disabled={!isOwner}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Spouse ID</label>
        <input type="text" name="spouse" className="form-control" value={formData.spouse} onChange={handleChange} disabled={!isOwner} placeholder="System ID" />
        {suggestedSpouses.length > 0 && !formData.spouse && isOwner && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Suggestions (Co-parents): 
            {suggestedSpouses.map(id => (
              <button 
                key={id} 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, spouse: id }))} 
                className="btn btn-text" 
                style={{ padding: '2px 8px', fontSize: '0.8rem', marginLeft: '4px', backgroundColor: 'rgba(98,0,234,0.05)', borderRadius: '4px' }}
              >
                {people.find(p => p.id === id)?.name || id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Spouse Start Date</label>
        <input type="date" name="spouseStartDate" className="form-control" value={formData.spouseStartDate} onChange={handleChange} disabled={!isOwner} />
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} disabled={!isOwner} />
      </div>

      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />
      
      <h4 style={{ marginBottom: '12px' }}>Parents</h4>
      <div className="form-group mb-4">
        <label className="form-label">Primary Mother ID</label>
        <ParentIdInput value={parents.primaryMother} onChange={(val) => handleParentChange('primaryMother', val)} disabled={!isOwner} placeholder="e.g. aB3x9Yq2" />
      </div>
      <div className="form-group mb-4">
        <label className="form-label">Primary Father ID</label>
        <ParentIdInput value={parents.primaryFather} onChange={(val) => handleParentChange('primaryFather', val)} disabled={!isOwner} placeholder="e.g. aB3x9Yq2" />
      </div>

      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />
      
      <div className="d-flex align-center justify-between mb-2">
        <h4 style={{ margin: 0 }}>Additional Attributes</h4>
        {isOwner && (
          <button type="button" className="btn btn-text" onClick={addCustomField} style={{ padding: '4px' }}>
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {customFields.map((field, index) => (
        <div key={index} className="d-flex align-center gap-2 mb-2">
          <input type="text" className="form-control" placeholder="Key" value={field.key} onChange={(e) => updateCustomField(index, 'key', e.target.value)} disabled={!isOwner} />
          <input type="text" className="form-control" placeholder="Value" value={field.value} onChange={(e) => updateCustomField(index, 'value', e.target.value)} disabled={!isOwner} />
          {isOwner && (
            <button type="button" className="btn btn-text" style={{ color: 'var(--error-color)', padding: '8px' }} onClick={() => removeCustomField(index)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {isOwner && (
        <div className="d-flex align-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <button onClick={() => onDelete(person.id)} className="btn btn-outline" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }}>
            Delete
          </button>
          <div className="d-flex gap-2">
            <button onClick={onDiscard} className="btn btn-text">Discard</button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

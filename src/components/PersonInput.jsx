import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Copy, Check, ClipboardPaste, Search, X } from 'lucide-react';
import { generateUniqueId } from '../utils/generateId';

const ParentIdInput = ({ value, onChange, disabled, placeholder, people }) => {
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = (people || []).filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

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
    <div className="d-flex align-center gap-2" style={{ position: 'relative' }}>
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        <input type="text" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} style={{ paddingRight: '30px' }} />
        <button type="button" className="btn btn-text" style={{ position: 'absolute', right: '4px', padding: '4px' }} onClick={() => { setShowSearch(!showSearch); setQuery(''); }} title="Search Person" disabled={disabled}>
          <Search size={14} color="var(--primary-color)" />
        </button>
      </div>

      {value ? (
        <button type="button" onClick={handleCopy} className="btn btn-text" style={{ padding: '8px', minWidth: 'auto', color: copied ? 'green' : 'var(--primary-color)' }} title="Copy ID">
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      ) : (
        <button type="button" onClick={handlePaste} className="btn btn-text" style={{ padding: '8px', minWidth: 'auto', color: 'var(--primary-color)' }} title="Paste ID" disabled={disabled}>
          <ClipboardPaste size={18} />
        </button>
      )}

      {showSearch && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, width: '250px', backgroundColor: 'var(--surface-color)', 
          boxShadow: 'var(--elevation-3)', borderRadius: '8px', zIndex: 100, padding: '8px', marginTop: '4px'
        }}>
          <div className="d-flex align-center gap-2 mb-2">
            <input 
              autoFocus
              type="text" 
              className="form-control" 
              placeholder="Search name..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, padding: '4px 8px' }}
            />
            <button className="btn btn-text" onClick={() => setShowSearch(false)} style={{ padding: '4px' }}>
              <X size={14} />
            </button>
          </div>
          {query && filtered.map(p => (
            <div 
              key={p.id} 
              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.8rem' }}
              onClick={() => { onChange(p.id); setShowSearch(false); }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(98,0,234,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ fontWeight: 'bold' }}>{p.name}</div>
              <div style={{ color: 'var(--text-secondary)' }}>ID: {p.id}</div>
            </div>
          ))}
          {query && filtered.length === 0 && (
             <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function PersonInput({ people, onSave, initialData = null, currentUser }) {
  const navigate = useNavigate();
  const isEditing = !!initialData;
  const [copiedId, setCopiedId] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    dob: '',
    height: '',
    race: '',
    gender: '',
    spouse: '',
    spouseStartDate: '',
    address: '',
    ancestralVillage: '',
    notes: '',
    isPublic: true,
  });

  const [saveStatus, setSaveStatus] = useState(null);

  const [parents, setParents] = useState({
    primaryMother: '',
    primaryFather: '',
    primaryMotherStartYear: '',
    primaryMotherEndYear: '',
    primaryFatherStartYear: '',
    primaryFatherEndYear: '',
    others: []
  });

  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        dob: initialData.dob || '',
        height: initialData.height || '',
        race: initialData.race || '',
        gender: initialData.gender || '',
        spouse: initialData.spouse || '',
        spouseStartDate: initialData.spouseStartDate || '',
        address: initialData.address || '',
        ancestralVillage: initialData.ancestralVillage || '',
        notes: initialData.notes || '',
        isPublic: initialData.isPublic !== false,
      });
      setParents({
        primaryMother: initialData.parents?.primaryMother || '',
        primaryFather: initialData.parents?.primaryFather || '',
        primaryMotherStartYear: initialData.parents?.primaryMotherStartYear || '',
        primaryMotherEndYear: initialData.parents?.primaryMotherEndYear || '',
        primaryFatherStartYear: initialData.parents?.primaryFatherStartYear || '',
        primaryFatherEndYear: initialData.parents?.primaryFatherEndYear || '',
        others: initialData.parents?.others || []
      });
      setCustomFields(initialData.customFields || []);
    } else {
      setFormData(prev => ({ ...prev, id: generateUniqueId() }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleParentChange = (name, value) => {
    setParents(prev => ({ ...prev, [name]: value }));
  };

  const addStepParent = () => {
    setParents(prev => ({
      ...prev,
      others: [...prev.others, { id: '', role: '', startYear: '', endYear: '' }]
    }));
  };

  const updateStepParent = (index, field, value) => {
    const newOthers = [...parents.others];
    newOthers[index][field] = value;
    
    let updates = { others: newOthers };
    if (field === 'role') {
      const dobYear = formData.dob ? formData.dob.split('-')[0] : '';
      if (value === 'Step Father') {
        updates.primaryFatherStartYear = dobYear;
      } else if (value === 'Step Mother') {
        updates.primaryMotherStartYear = dobYear;
      }
    }
    
    setParents(prev => ({ ...prev, ...updates }));
  };

  const removeStepParent = (index) => {
    const newOthers = parents.others.filter((_, i) => i !== index);
    setParents(prev => ({ ...prev, others: newOthers }));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setSaveStatus('saving');

    const validCustomFields = customFields.filter(f => f.key.trim() !== '' && f.value.trim() !== '');
    const validOthers = parents.others.filter(o => o.id.trim() !== '');

    const personData = {
      ...formData,
      createdBy: initialData?.createdBy || currentUser,
      parents: {
        primaryMother: parents.primaryMother.trim() || null,
        primaryFather: parents.primaryFather.trim() || null,
        primaryMotherStartYear: parents.primaryMotherStartYear?.trim() || null,
        primaryMotherEndYear: parents.primaryMotherEndYear?.trim() || null,
        primaryFatherStartYear: parents.primaryFatherStartYear?.trim() || null,
        primaryFatherEndYear: parents.primaryFatherEndYear?.trim() || null,
        others: validOthers
      },
      customFields: validCustomFields
    };

    setTimeout(() => {
      onSave(personData);
      setSaveStatus('saved');
      
      setTimeout(() => {
        setSaveStatus(null);
        if (!isEditing) navigate('/');
      }, 1500);
    }, 300);
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="d-flex align-center justify-between mb-4">
        <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Person' : 'Add Person to Lineage'}</h2>
        <div className="d-flex align-center gap-2" style={{ backgroundColor: 'rgba(98,0,234,0.1)', padding: '8px 16px', borderRadius: '16px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
          ID: {formData.id}
          <button 
            type="button"
            onClick={copyToClipboard}
            className="btn btn-text"
            style={{ padding: '4px', minWidth: 'auto', color: copiedId ? 'green' : 'var(--primary-color)' }}
            title="Copy System ID"
          >
            {copiedId ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Full Name *</label>
            <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input type="date" name="dob" className="form-control" value={formData.dob} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Height</label>
            <input type="text" name="height" className="form-control" value={formData.height} onChange={handleChange} placeholder="e.g., 180cm" />
          </div>

          <div className="form-group">
            <label className="form-label">Race / Ethnicity</label>
            <input type="text" name="race" className="form-control" value={formData.race} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Spouse ID</label>
            <ParentIdInput value={formData.spouse} onChange={(val) => setFormData(prev => ({ ...prev, spouse: val }))} placeholder="System ID of Spouse" people={people} />
          </div>
          <div className="form-group">
            <label className="form-label">Spouse Start Date</label>
            <input type="date" name="spouseStartDate" className="form-control" value={formData.spouseStartDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} placeholder="Current Location" />
          </div>
          <div className="form-group">
            <label className="form-label">Ancestral Village</label>
            <input type="text" name="ancestralVillage" className="form-control" value={formData.ancestralVillage} onChange={handleChange} placeholder="Origin" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Notes</label>
          <textarea name="notes" className="form-control" rows="3" value={formData.notes} onChange={handleChange} placeholder="Any additional information, life events, or background..."></textarea>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '32px 0' }} />

        <h3 style={{ marginBottom: '8px' }}>Parental Lineage (Using System IDs)</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
          Link this person to their parents by providing the exact System ID of the parent.
        </p>

        <div className="form-group mb-4">
          <label className="form-label">Primary Mother ID</label>
          <ParentIdInput value={parents.primaryMother} onChange={(val) => handleParentChange('primaryMother', val)} placeholder="e.g. aB3x9Yq2" people={people} />
          <div className="d-flex gap-2 mt-2">
            <input type="text" className="form-control" placeholder="Start Year (YYYY)" value={parents.primaryMotherStartYear} onChange={e => handleParentChange('primaryMotherStartYear', e.target.value)} style={{flex: 1}} />
            <input type="text" className="form-control" placeholder="End Year (YYYY)" value={parents.primaryMotherEndYear} onChange={e => handleParentChange('primaryMotherEndYear', e.target.value)} style={{flex: 1}} />
          </div>
        </div>
        <div className="form-group mb-4">
          <label className="form-label">Primary Father ID</label>
          <ParentIdInput value={parents.primaryFather} onChange={(val) => handleParentChange('primaryFather', val)} placeholder="e.g. aB3x9Yq2" people={people} />
          <div className="d-flex gap-2 mt-2">
            <input type="text" className="form-control" placeholder="Start Year (YYYY)" value={parents.primaryFatherStartYear} onChange={e => handleParentChange('primaryFatherStartYear', e.target.value)} style={{flex: 1}} />
            <input type="text" className="form-control" placeholder="End Year (YYYY)" value={parents.primaryFatherEndYear} onChange={e => handleParentChange('primaryFatherEndYear', e.target.value)} style={{flex: 1}} />
          </div>
        </div>

        <div className="d-flex align-center justify-between mb-4">
          <h4 style={{ margin: 0 }}>Step-Parents / Other Guardians</h4>
          <button type="button" className="btn btn-outline" onClick={addStepParent}>
            <Plus size={16} /> Add Step-Parent
          </button>
        </div>

        {parents.others.map((sp, index) => (
          <div key={index} className="dynamic-field-row" style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px' }}>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Parent ID</label>
              <ParentIdInput value={sp.id} onChange={(val) => updateStepParent(index, 'id', val)} placeholder="System ID" people={people} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={sp.role} onChange={(e) => updateStepParent(index, 'role', e.target.value)}>
                <option value="">Select Role</option>
                <option value="Step Father">Step Father</option>
                <option value="Step Mother">Step Mother</option>
                <option value="Adoptive Parent">Adoptive Parent</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 0.5 }}>
              <label className="form-label">Start Year</label>
              <input type="text" className="form-control" value={sp.startYear} onChange={(e) => updateStepParent(index, 'startYear', e.target.value)} placeholder="YYYY" />
            </div>
            <div className="form-group" style={{ flex: 0.5 }}>
              <label className="form-label">End Year</label>
              <input type="text" className="form-control" value={sp.endYear} onChange={(e) => updateStepParent(index, 'endYear', e.target.value)} placeholder="YYYY" />
            </div>
            <button type="button" className="btn btn-text" style={{ color: 'var(--error-color)', padding: '12px' }} onClick={() => removeStepParent(index)}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '32px 0' }} />

        <div className="d-flex align-center justify-between mb-4">
          <h3 style={{ margin: 0 }}>Additional Attributes</h3>
          <button type="button" className="btn btn-outline" onClick={addCustomField}>
            <Plus size={16} /> Add Field
          </button>
        </div>

        {customFields.map((field, index) => (
          <div key={index} className="dynamic-field-row">
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Attribute (e.g. Height)" value={field.key} onChange={(e) => updateCustomField(index, 'key', e.target.value)} />
            </div>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Value" value={field.value} onChange={(e) => updateCustomField(index, 'value', e.target.value)} />
            </div>
            <button type="button" className="btn btn-text" style={{ color: 'var(--error-color)', padding: '12px' }} onClick={() => removeCustomField(index)}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '32px 0' }} />

        <div className="d-flex align-center justify-between mt-4">
          <label className="switch-label">
            <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} />
            Make this person's record public
          </label>
          <button type="submit" className="btn btn-primary" disabled={saveStatus === 'saving' || saveStatus === 'saved'}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? <><Check size={18} /> Saved!</> : <><Save size={18} /> {isEditing ? 'Update Person' : 'Save Person'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

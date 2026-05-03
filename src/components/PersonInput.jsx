import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Copy, Check, ClipboardPaste } from 'lucide-react';
import { generateUniqueId } from '../utils/generateId';

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
    address: '',
    isPublic: true,
  });

  const [parents, setParents] = useState({
    primaryMother: '',
    primaryFather: '',
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
        address: initialData.address || '',
        isPublic: initialData.isPublic !== false,
      });
      setParents({
        primaryMother: initialData.parents?.primaryMother || '',
        primaryFather: initialData.parents?.primaryFather || '',
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
      others: [...prev.others, { id: '', role: 'Step-Parent', startYear: '', endYear: '' }]
    }));
  };

  const updateStepParent = (index, field, value) => {
    const newOthers = [...parents.others];
    newOthers[index][field] = value;
    setParents(prev => ({ ...prev, others: newOthers }));
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

    const validCustomFields = customFields.filter(f => f.key.trim() !== '' && f.value.trim() !== '');
    const validOthers = parents.others.filter(o => o.id.trim() !== '');

    onSave({
      ...formData,
      createdBy: initialData?.createdBy || currentUser,
      parents: {
        primaryMother: parents.primaryMother.trim() || null,
        primaryFather: parents.primaryFather.trim() || null,
        others: validOthers
      },
      customFields: validCustomFields
    });
    
    navigate('/');
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
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
            <input type="text" name="spouse" className="form-control" value={formData.spouse} onChange={handleChange} placeholder="System ID of Spouse" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} placeholder="Current Location" />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '32px 0' }} />

        <h3 style={{ marginBottom: '8px' }}>Parental Lineage (Using System IDs)</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
          Link this person to their parents by providing the exact System ID of the parent.
        </p>

        <div className="form-group mb-4">
          <label className="form-label">Primary Mother ID</label>
          <ParentIdInput value={parents.primaryMother} onChange={(val) => handleParentChange('primaryMother', val)} placeholder="e.g. aB3x9Yq2" />
        </div>
        <div className="form-group mb-4">
          <label className="form-label">Primary Father ID</label>
          <ParentIdInput value={parents.primaryFather} onChange={(val) => handleParentChange('primaryFather', val)} placeholder="e.g. aB3x9Yq2" />
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
              <ParentIdInput value={sp.id} onChange={(val) => updateStepParent(index, 'id', val)} placeholder="System ID" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Role</label>
              <input type="text" className="form-control" value={sp.role} onChange={(e) => updateStepParent(index, 'role', e.target.value)} placeholder="e.g. Step-Mother" />
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
          <button type="submit" className="btn btn-primary">
            <Save size={18} /> {isEditing ? 'Update Person' : 'Save Person'}
          </button>
        </div>
      </form>
    </div>
  );
}

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PersonInput from './PersonInput';

export default function EditPerson({ people, onUpdate }) {
  const { id } = useParams();
  
  const person = people.find(p => p.id === id);

  if (!person) {
    return <Navigate to="/" replace />;
  }

  // Security check: Only allow edit if currentUser created it
  if (person.createdBy !== 'currentUser') {
    return (
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error-color)' }}>Access Denied</h2>
        <p>You do not have permission to edit this record because you didn't create it.</p>
      </div>
    );
  }

  return <PersonInput people={people} onSave={onUpdate} initialData={person} />;
}

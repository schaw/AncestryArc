import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PersonInput from './PersonInput';

export default function EditPerson({ people, onUpdate, currentUser }) {
  const { id } = useParams();
  
  const person = people.find(p => p.id === id);

  if (!person) {
    return <Navigate to="/" replace />;
  }

  return <PersonInput people={people} onSave={onUpdate} initialData={person} currentUser={currentUser} />;
}

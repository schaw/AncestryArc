import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const COLLECTION_NAME = 'family_members';

/**
 * Real-time listener for the family tree collection in Firestore
 */
export function subscribeToFamilyLineage(onUpdate, onError) {
  if (!isFirebaseConfigured || !db) return () => {};

  const colRef = collection(db, COLLECTION_NAME);

  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (err) => {
    console.error("Firestore subscription error:", err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

/**
 * Save or update a single person in Firestore
 */
export async function savePersonToFirestore(person, user) {
  if (!isFirebaseConfigured || !db) return;

  const docRef = doc(db, COLLECTION_NAME, person.id);
  const dataToSave = {
    ...person,
    updatedAt: new Date().toISOString(),
    updatedBy: user?.displayName || user?.email || person.createdBy || 'anonymous'
  };

  await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Delete a person record from Firestore
 */
export async function deletePersonFromFirestore(personId) {
  if (!isFirebaseConfigured || !db) return;

  const docRef = doc(db, COLLECTION_NAME, personId);
  await deleteDoc(docRef);
}

/**
 * Batch upload / migration of a full dataset (e.g. initial 39 members) to Firestore
 */
export async function uploadFullTreeToFirestore(peopleList, user) {
  if (!isFirebaseConfigured || !db || !peopleList?.length) return;

  const batch = writeBatch(db);
  const colRef = collection(db, COLLECTION_NAME);

  peopleList.forEach((person) => {
    const docRef = doc(colRef, person.id);
    batch.set(docRef, {
      ...person,
      migratedAt: new Date().toISOString(),
      updatedBy: user?.displayName || user?.email || 'migration'
    }, { merge: true });
  });

  await batch.commit();
}

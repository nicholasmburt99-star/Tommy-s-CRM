import { initializeApp } from 'firebase/app';
import { getFirestore, doc } from 'firebase/firestore';

// TODO: replace with Tommy's own Firebase project config before deploying
// (see SETUP.md) — do NOT reuse Nick's project, or this app will read/write
// his live production data.
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const CRM_DOC = doc(db, 'crm', 'data');

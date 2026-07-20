import { initializeApp } from 'firebase/app';
import { getFirestore, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDL7Uqc609fzVh5vsc4wyzgBdOWIFQU6co",
  authDomain: "tommy-s-crm.firebaseapp.com",
  projectId: "tommy-s-crm",
  storageBucket: "tommy-s-crm.firebasestorage.app",
  messagingSenderId: "1013085981597",
  appId: "1:1013085981597:web:3b51e5201f4faeb4e5bd74",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const CRM_DOC = doc(db, 'crm', 'data');

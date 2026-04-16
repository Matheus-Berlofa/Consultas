// IMPORTS FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAakSsroQDldr-48xTa4OHFFr6cVD16Bao",
  authDomain: "laboratorio-e366b.firebaseapp.com",
  projectId: "laboratorio-e366b",
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// EXPORTA
export { auth, db };
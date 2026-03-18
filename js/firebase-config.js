// --- CONFIGURACIÓN DE FIREBASE ---
// Importamos las funciones necesarias desde los servidores de Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyC_Y49t9ZypCemnDbQqUyOABQqIozYlnOw",
  authDomain: "bianca-s-page.firebaseapp.com",
  projectId: "bianca-s-page",
  storageBucket: "bianca-s-page.firebasestorage.app",
  messagingSenderId: "880830304095",
  appId: "1:880830304095:web:132ea2206e3af4822530ea",
  measurementId: "G-66KNESPFHP"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Exportar las herramientas para usarlas en schedule.js
export { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc };
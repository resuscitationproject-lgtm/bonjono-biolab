import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  Timestamp,
  GeoPoint,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase Console > プロジェクトの設定 > マイアプリ で表示される値に置き換えてください。
const firebaseConfig = {
  apiKey: "AIzaSyDYIYWHaHA1C6NSySqan-Kxlw2tUP3Ba3E",
  authDomain: "greenbird-kokura-map.firebaseapp.com",
  projectId: "greenbird-kokura-map",
  storageBucket: "greenbird-kokura-map.firebasestorage.app",
  messagingSenderId: "202076525194",
  appId: "1:202076525194:web:279d8eba1c7e22dfb65373",
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  value.startsWith("YOUR_"),
);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export {
  Timestamp,
  GeoPoint,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  onAuthStateChanged,
  query,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
};

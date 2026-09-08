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
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6_ol4suLlaV5-Lby9ybTAX59L8nhITFM",
  authDomain: "greenbird-kokura-map-c108d.firebaseapp.com",
  projectId: "greenbird-kokura-map-c108d",
  storageBucket: "greenbird-kokura-map-c108d.firebasestorage.app",
  messagingSenderId: "977537889897",
  appId: "1:977537889897:web:a8c8d21c6d9e81c4ae54f8",
  measurementId: "G-ZMYC1F19K0"
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  value.startsWith("YOUR_"),
);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
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
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
};

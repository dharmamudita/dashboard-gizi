import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, updateProfile } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvYD1kR3CUkfJYCpYDXufkDuo5XGHtmSo",
  authDomain: "dashboard-4a21c.firebaseapp.com",
  projectId: "dashboard-4a21c",
  storageBucket: "dashboard-4a21c.firebasestorage.app",
  messagingSenderId: "211920767965",
  appId: "1:211920767965:web:c3ae65113fa144ef068434",
  measurementId: "G-X8KPHE93QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper function to update profile name
export const setDisplayName = async (user, name) => {
  try {
    await updateProfile(user, { displayName: name });
  } catch (error) {
    console.error("Error updating profile", error);
  }
};

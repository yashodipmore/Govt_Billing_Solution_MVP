// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWHKoZXN8FpI2RrDfx4TMmb_GpfGFcg84",
  authDomain: "govt-billing-solution.firebaseapp.com",
  projectId: "govt-billing-solution",
  storageBucket: "govt-billing-solution.firebasestorage.app",
  messagingSenderId: "785051742507",
  appId: "1:785051742507:web:afdda02f1fcbff71a1d56e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

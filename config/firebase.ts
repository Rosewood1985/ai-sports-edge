import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config (replace with your actual values)
const firebaseConfig = {
  apiKey: "AIzaSyDxLufbPyNYpax2MmE5ff27MHA-js9INBw",
  authDomain: "AI Sports Edge.firebaseapp.com",
  projectId: "ai-sports-edge",
  storageBucket: "ai-sports-edge.appspot.com",
  messagingSenderId: "63216708515",
  appId: "1:63216708515:web:209e6baf130386edb00816"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
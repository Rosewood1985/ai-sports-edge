import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'firebase/app';
// Replaced with firebaseService
// Replaced with firebaseService
// Replaced with firebaseService

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

// Get the auth, firestore, and functions instances
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);

// Export the Firebase services
export { app, auth, firestore, functions };
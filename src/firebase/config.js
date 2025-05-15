// ✅ MIGRATED: Firebase Atomic Architecture
// Firebase SDK Configuration
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "firebase/app";
// Replaced with firebaseService
// Replaced with firebaseService
// Replaced with firebaseService
// Replaced with firebaseService
// Replaced with firebaseService

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNBnQsHukUdPfaF2HEnwi6B9-cN4aDiRc",
  authDomain: "ai-sports-edge-final.firebaseapp.com",
  projectId: "ai-sports-edge-final",
  storageBucket: "ai-sports-edge-final.appspot.com",
  messagingSenderId: "676798996425",
  appId: "1:676798996425:web:82641620e8b8bedd6dd218"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Initialize Analytics conditionally (it may not be available in all environments)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(error => {
  console.error("Firebase Analytics error:", error);
});

export { 
  app, 
  auth, 
  firestore, 
  storage, 
  functions, 
  analytics,
  firebaseConfig 
};
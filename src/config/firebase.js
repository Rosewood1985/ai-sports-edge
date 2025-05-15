// ✅ MIGRATED: Firebase Atomic Architecture
// firebase.js
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "firebase/app";
// Replaced with firebaseService
// Replaced with firebaseService

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

// Export services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

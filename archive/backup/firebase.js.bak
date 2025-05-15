import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "firebase/app";
// Replaced with firebaseService
// Replaced with firebaseService
import { firebaseConfig, validateConfig } from "./utils/envConfig";

// Initialize Firebase with error handling
let app, auth, db;

try {
  // Validate required config values
  if (validateConfig(firebaseConfig, ['apiKey', 'authDomain', 'projectId'])) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Add better error handling for auth operations
    auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? "User logged in" : "User logged out");
    });
  } else {
    console.error('Firebase initialization skipped due to missing configuration');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export the auth and db instances
export { auth, db };

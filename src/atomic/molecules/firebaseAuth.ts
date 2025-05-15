import { getAuth } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import firebaseApp from '../atoms/firebaseApp';

/**
 * Firebase Auth Molecule
 * Provides authentication functionality
 */

// Initialize Firebase Auth
const auth = getAuth(firebaseApp);

// Auth methods
const signIn = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

const signUp = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);

const logOut = () => signOut(auth);

const resetPassword = (email: string) => 
  sendPasswordResetEmail(auth, email);

const onAuthStateChange = (callback: (user: User | null) => void) => 
  onAuthStateChanged(auth, callback);

// Social auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

// Social sign-in methods
const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
const signInWithTwitter = () => signInWithPopup(auth, twitterProvider);

// Profile methods
const updateUserProfile = (profile: { displayName?: string | null; photoURL?: string | null }) => {
  if (!auth.currentUser) {
    return Promise.reject(new Error('No user is signed in'));
  }
  return updateProfile(auth.currentUser, profile);
};

const verifyEmail = () => {
  if (!auth.currentUser) {
    return Promise.reject(new Error('No user is signed in'));
  }
  return sendEmailVerification(auth.currentUser);
};

export {
  auth,
  signIn,
  signUp,
  logOut,
  resetPassword,
  onAuthStateChange,
  signInWithGoogle,
  signInWithFacebook,
  signInWithTwitter,
  updateUserProfile,
  verifyEmail
};
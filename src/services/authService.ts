import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isPlatform } from '@ionic/react';

export const authService = {
  // Email/Password Sign Up
  signup: async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  },

  // Email/Password Sign In
  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Google Sign In
  signInWithGoogle: async () => {
    if (isPlatform('capacitor')) {
      // Use Capacitor plugin for mobile
      const result = await FirebaseAuthentication.signInWithGoogle();
      return result.user;
    } else {
      // Use web popup for browser
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
  },

  // Sign Out
  logout: async () => {
    if (isPlatform('capacitor')) {
      await FirebaseAuthentication.signOut();
    } else {
      await signOut(auth);
    }
  },

  // Password Reset
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Get Current User
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { 
  initializeFirestore,
  collection, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  increment,
  where,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.error("Firebase configuration is incomplete. Check firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore instead of getFirestore to enable long polling
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Connection test with better guidance
async function testConnection() {
  try {
    // Try to fetch a non-existent doc just to check connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase Firestore connection successful.");
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      console.warn("Firestore: Failed precondition. This usually means the database is not enabled or index is missing.");
    } else if (error.message && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: The client is offline.");
      console.info("TIP: Check if Firestore is enabled in your Firebase Console (dna-users) and that you've selected a region.");
    } else if (error.code === 'permission-denied') {
      console.log("Firestore connection test: Rules are working (Permission Denied as expected for test doc).");
    } else {
      console.log("Firestore connection test result:", error.code || error.message);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  increment,
  where,
  writeBatch
};
export type { User };

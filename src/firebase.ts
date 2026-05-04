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
  getFirestore,
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.error("Firebase configuration is incomplete. Check firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use initializeFirestore with long polling for better connectivity in restricted environments
const db = (firebaseConfig as any).firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, (firebaseConfig as any).firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

let storage: any;
try {
  if (firebaseConfig.storageBucket) {
    storage = getStorage(app);
    console.log("Firebase Storage initialized with bucket:", firebaseConfig.storageBucket);
  } else {
    console.warn("Firebase Storage: No storageBucket found in config.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Storage:", error);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Connection test with better guidance
async function testConnection() {
  console.log(`[Firebase] Testing connection to project: ${firebaseConfig.projectId}...`);
  
  try {
    // Try a simple server-side fetch to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("[Firebase] Firestore connection test successful.");
  } catch (error: any) {
    const isOffline = error.message?.includes('the client is offline') || error.code === 'unavailable';
    
    if (isOffline) {
      console.error("[Firebase] connection failed: The client is offline.");
      console.info("%c ACTION REQUIRED: %c", "background: #f44336; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", "color: #f44336; font-weight: bold;");
      console.info(`The Firestore database for project '${firebaseConfig.projectId}' is unreachable.`);
      console.info("Please verify the following in the Firebase Console:");
      console.info(`1. Cloud Firestore is enabled at https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
      console.info("2. You have created a database (default or custom ID).");
      console.info("3. If using a custom database ID, ensure it's added to firebase-applet-config.json as 'firestoreDatabaseId'.");
      console.info("4. Security rules allow at least read access to the test path or you are hitting a permission error (which is fine).");
    } else if (error.code === 'permission-denied') {
      console.log("[Firebase] Firestore connection test: Permission denied (this is expected). Connectivity confirmed.");
    } else {
      console.log("[Firebase] Firestore test result:", error.code || error.message);
    }
  }
}
setTimeout(testConnection, 3000); // Delay test to allow initial startup

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
  auth,
  db,
  storage,
  googleProvider,
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
  writeBatch,
  ref,
  uploadBytes,
  getDownloadURL
};
export type { User };

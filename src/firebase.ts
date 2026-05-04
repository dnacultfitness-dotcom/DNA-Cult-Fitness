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

// Standard getFirestore
const db = getFirestore(app);

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
  
  if (firebaseConfig.appId.length < 30) {
    console.warn("WARNING: appId seems unusually short. Please double-check it in Firebase Console.");
  }

  try {
    // Try a simple server-side fetch to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("[Firebase] Firestore connection test successful.");
  } catch (error: any) {
    const isOffline = error.message?.includes('the client is offline') || error.code === 'unavailable';
    
    if (isOffline) {
      console.error("[Firebase] connection failed: The client is offline.");
      console.info("%c ACTION REQUIRED: %c", "background: #f44336; color: white; font-weight: bold; padding: 2px 5px; border-radius: 2px;", "color: #f44336; font-weight: bold;");
      console.info(`The project '${firebaseConfig.projectId}' is unreachable.`);
      console.info("1. Ensure 'Cloud Firestore' is ENABLED in Firebase Console.");
      console.info("2. Go to https://console.firebase.google.com/project/dna-users/firestore and click 'Create Database'.");
      console.info("3. Ensure you have selected a location (e.g., asia-southeast1) and started in 'Production' or 'Test' mode.");
    } else if (error.code === 'permission-denied') {
      console.log("[Firebase] Firestore connection test: Permission denied (this is expected for test doc). Rules are working.");
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

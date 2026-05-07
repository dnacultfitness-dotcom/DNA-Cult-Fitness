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
} else {
  console.log("[Firebase] Config loaded for project:", firebaseConfig.projectId);
  // Log partial key to help user verify without exposing full secret
  if (firebaseConfig.apiKey) {
    console.log("[Firebase] API Key (last 4 characters):", firebaseConfig.apiKey.slice(-4));
  }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use initializeFirestore with settings for better connectivity in restricted environments
const db = (firebaseConfig as any).firestoreDatabaseId 
  ? initializeFirestore(app, { 
      experimentalForceLongPolling: true 
    }, (firebaseConfig as any).firestoreDatabaseId)
  : initializeFirestore(app, { 
      experimentalForceLongPolling: true 
    });

// Connectivity logs
if (typeof window !== 'undefined') {
  console.log("[Network] Status:", window.navigator.onLine ? "online" : "offline");
  console.log("[Domain] Current:", window.location.hostname);
  window.addEventListener('online', () => console.log("[Network] ONLINE"));
  window.addEventListener('offline', () => console.log("[Network] OFFLINE"));
}

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
  console.log(`[Firebase] Current Host: ${typeof window !== 'undefined' ? window.location.host : 'SSR'}`);
  
  try {
    // Try a simple server-side fetch to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("[Firebase] Firestore connection test successful.");
  } catch (error: any) {
    const isOffline = error.message?.includes('the client is offline') || 
                      error.code === 'unavailable' || 
                      error.message?.includes('Could not reach Cloud Firestore backend');
    
    if (isOffline) {
      console.error("[Firebase] Connection failed: The Firestore backend is unreachable.");
      // Identify if we're on a custom domain that might need authorization
      if (typeof window !== 'undefined' && !window.location.host.includes('run.app')) {
        console.warn("[Firebase] Detected custom domain. Ensure this domain is authorized in Firebase Console.");
      }

      console.info("%c ACTION REQUIRED %c", "background: #f44336; color: white; font-weight: bold; padding: 2px 10px; border-radius: 4px;", "color: #f44336; font-weight: bold;");
      console.info(`The Firestore database for project '${firebaseConfig.projectId}' is unreachable.`);
      console.info("This ALMOST ALWAYS means Cloud Firestore is NOT initialized in the Firebase Console.");
      console.info("--------------------------------------------------");
      console.info(`1. OPEN THIS LINK: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
      console.info("2. If you see a 'Create Database' button, CLICK IT.");
      console.info("3. Select 'Start in Test Mode' and click 'Next'.");
      console.info("4. Select a location (e.g., asia-southeast1) and click 'Enable'.");
      console.info(`5. ALSO ENABLE THIS API: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${firebaseConfig.projectId}`);
      console.info("--------------------------------------------------");
      console.info("NOTE: 'Realtime Database' is a different service. You MUST enable 'Cloud Firestore'.");
    } else if (error.code === 'permission-denied') {
      console.log("[Firebase] Firestore connection test: Permission denied (this is expected). Connectivity confirmed.");
    } else {
      console.log("[Firebase] Firestore test result:", error.code || error.message);
      console.dir(error); // Log full error object for diagnostics
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

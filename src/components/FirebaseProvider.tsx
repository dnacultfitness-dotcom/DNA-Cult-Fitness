import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { auth, onAuthStateChanged, User, db, doc, onSnapshot, setDoc, serverTimestamp, handleFirestoreError, OperationType, query, collection, where, updateDoc, getDocs } from '../firebase';

interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
  lastActive: any;
  totalTimeOnSite: number;
  role: 'client' | 'trainer' | 'admin';
  trainerDocId?: string | null;
  assignedTrainerUid?: string | null;
}

interface PersonalDetails {
  name: string;
  phone: string;
  height: number;
  weight: number;
  gender: string;
  injury: string;
  lifestyleDisease: string;
  goal: string;
  updatedAt: any;
}

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  personalDetails: PersonalDetails | null;
  loading: boolean;
  isAdmin: boolean;
  isTrainer: boolean;
  trainerData: any | null;
  dbError: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [trainerData, setTrainerData] = useState<any | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is a trainer first to determine role on creation
        const trainerQuery = query(collection(db, 'trainers'), where('email', '==', currentUser.email));
        const unsubscribeTrainer = onSnapshot(trainerQuery, async (snapshot) => {
          setDbError(null);
          let tData = null;
          if (!snapshot.empty) {
            tData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            setTrainerData(tData);
            
            // Update role if user is client but exists in trainers table
            if (profile && profile.role === 'client') {
               updateDoc(doc(db, 'users', currentUser.uid), { 
                 role: 'trainer',
                 trainerDocId: tData.id
               }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`));
            }
          } else {
            setTrainerData(null);
          }
        }, (err) => {
          if (err.message?.includes('offline') || err.message?.includes('unreachable') || (err as any).code === 'unavailable') {
            setDbError('Firestore is unreachable. Please check project configuration.');
          }
          handleFirestoreError(err, OperationType.LIST, 'trainers');
        });

        // Sync user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setProfile(data);
            
            // Auto-fix admin role for the owner email if it's currently wrong
            if (currentUser.email === 'dnacultfitness@gmail.com' && data.role !== 'admin') {
              updateDoc(userDocRef, { role: 'admin' }).catch(() => {});
            }
            
            // Only update lastActive once per session
            const lastSessionUpdate = sessionStorage.getItem(`last_active_${currentUser.uid}`);
            const now = Date.now();
            // If not updated this session OR last update was more than 1 hour ago
            if (!lastSessionUpdate || now - parseInt(lastSessionUpdate) > 3600000) {
              updateDoc(userDocRef, { 
                lastActive: serverTimestamp(),
              }).catch(() => {});
              sessionStorage.setItem(`last_active_${currentUser.uid}`, now.toString());
            }
          } else {
            // Create profile if it doesn't exist
            const isDefaultAdmin = currentUser.email === 'dnacultfitness@gmail.com';
            // We need to check trainers again synchronously or use a getDoc
            const tSnap = await getDocs(query(collection(db, 'trainers'), where('email', '==', currentUser.email)));
            const isTrainerInTable = !tSnap.empty;
            const tDocId = isTrainerInTable ? tSnap.docs[0].id : null;

            const newProfile: UserProfile = {
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
              totalTimeOnSite: 0,
              role: isDefaultAdmin ? 'admin' : (isTrainerInTable ? 'trainer' : 'client'),
              trainerDocId: tDocId
            };
            setDoc(userDocRef, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));

        // Sync personal details
        const detailsDocRef = doc(db, 'users', currentUser.uid, 'details', 'personal');
        const unsubscribeDetails = onSnapshot(detailsDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setPersonalDetails(snapshot.data() as PersonalDetails);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}/details/personal`));

        setLoading(false);
        return () => {
          unsubscribeProfile();
          unsubscribeDetails();
          unsubscribeTrainer();
        };
      } else {
        setProfile(null);
        setPersonalDetails(null);
        setTrainerData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin' || user?.email === 'dnacultfitness@gmail.com';
  }, [profile, user]);

  const isTrainer = useMemo(() => {
    return !!trainerData || profile?.role === 'trainer';
  }, [trainerData, profile]);

  return (
    <FirebaseContext.Provider value={{ user, profile, personalDetails, loading, isAdmin, isTrainer, trainerData, dbError }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

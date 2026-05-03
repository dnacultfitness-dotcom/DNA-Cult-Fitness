import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { auth, onAuthStateChanged, User, db, doc, onSnapshot, setDoc, serverTimestamp, handleFirestoreError, OperationType, query, collection, where } from '../firebase';

interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
  lastActive: any;
  totalTimeOnSite: number;
  role: 'customer' | 'admin' | 'trainer' | 'user';
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
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [trainerData, setTrainerData] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Sync user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setProfile(data);
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
              totalTimeOnSite: 0,
              role: currentUser.email === 'dnacultfitness@gmail.com' ? 'admin' : 'customer'
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

        // Check if user is a trainer
        const trainerQuery = query(collection(db, 'trainers'), where('email', '==', currentUser.email));
        const unsubscribeTrainer = onSnapshot(trainerQuery, (snapshot) => {
          if (!snapshot.empty) {
            setTrainerData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          } else {
            setTrainerData(null);
          }
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'trainers'));

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
    <FirebaseContext.Provider value={{ user, profile, personalDetails, loading, isAdmin, isTrainer, trainerData }}>
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

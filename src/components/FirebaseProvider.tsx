import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged, User, db, doc, onSnapshot, setDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';

interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
  lastActive: any;
  totalTimeOnSite: number;
  role: 'user' | 'admin';
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
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
            setIsAdmin(data.role === 'admin' || currentUser.email === 'dnacultfitness@gmail.com');
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
              totalTimeOnSite: 0,
              role: currentUser.email === 'dnacultfitness@gmail.com' ? 'admin' : 'user'
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
        };
      } else {
        setProfile(null);
        setPersonalDetails(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, profile, personalDetails, loading, isAdmin }}>
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

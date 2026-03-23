import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invitee, WeddingContextType, WeddingSettings } from '../types';
import { db, auth, isFirebaseEnabled } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

// Local Mock keys
const STORAGE_KEY_SETTINGS = 'eternity_settings';
const STORAGE_KEY_INVITEES = 'eternity_invitees';
const ADMIN_EMAIL = 'miyurupraveen@gmail.com'; // Using the user's email as the admin account

const defaultSettings: WeddingSettings = {
  inviteImage: null,
  coupleName: 'Pamodya & Miyuru',
  weddingDate: '2026-04-27',
  venueName: 'Radisson Blu Resort',
  venueAddress: '523C Galle - Colombo Rd, Galle 80280',
  mapUrl: 'https://maps.app.goo.gl/KhehG47U598yoFK49'
};

// Simple ID generator compatible with all environments
const generateId = () => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
};

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WeddingSettings>(defaultSettings);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setLoading] = useState(true);

  // --- 1. Load Data (Firebase vs LocalStorage) ---
  useEffect(() => {
    // Capture db locally to ensure TypeScript knows it's not null inside callbacks
    const firestore = db;

    if (isFirebaseEnabled && firestore && auth) {
      // CLOUD MODE: Real-time listeners
      console.log("Wedding Context: Initializing in Cloud Mode (Firebase)");
      
      const unsubAuth = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(!!user);
      });

      // Listen to Settings
      const unsubSettings = onSnapshot(doc(firestore, 'general', 'settings'), (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as WeddingSettings);
        } else {
          // Initialize if missing
          setDoc(doc(firestore, 'general', 'settings'), defaultSettings);
        }
      }, (error) => {
        console.error("Firebase settings listener failed:", error);
      });

      // Listen to Invitees
      const q = query(collection(firestore, 'invitees'));
      const unsubInvitees = onSnapshot(q, (querySnapshot) => {
        const guests: Invitee[] = [];
        querySnapshot.forEach((doc) => {
          guests.push(doc.data() as Invitee);
        });
        
        // Sort by createdAt (oldest first) to match Excel order
        // Fallback to name for existing records without createdAt
        guests.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return a.createdAt - b.createdAt;
          }
          // If one has createdAt and other doesn't, put the one with createdAt last (newest)
          if (a.createdAt) return 1;
          if (b.createdAt) return -1;
          
          // Fallback to alphabetical for old records
          return a.name.localeCompare(b.name);
        });
        
        setInvitees(guests);
        setLoading(false);
      }, (error) => {
        console.error("Firebase invitees listener failed:", error);
      });

      return () => {
        unsubAuth();
        unsubSettings();
        unsubInvitees();
      };
    } else {
      // LOCAL MODE: Load from browser storage
      console.warn("Wedding Context: Initializing in Local Demo Mode (Offline)");
      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const storedInvitees = localStorage.getItem(STORAGE_KEY_INVITEES);

      if (storedSettings) setSettings(JSON.parse(storedSettings));
      if (storedInvitees) setInvitees(JSON.parse(storedInvitees));
      setLoading(false);
    }
  }, []);

  // --- 2. Save Data ---
  
  // Local Storage Fallback Saver
  useEffect(() => {
    if (!isFirebaseEnabled) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    if (!isFirebaseEnabled) {
      localStorage.setItem(STORAGE_KEY_INVITEES, JSON.stringify(invitees));
    }
  }, [invitees]);


  // --- Actions ---

  const login = async (password: string) => {
    if (isFirebaseEnabled && auth) {
      try {
        // Try to sign in
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        setIsAuthenticated(true);
        return true;
      } catch (error: any) {
        // If user doesn't exist, create it with this password
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password);
            setIsAuthenticated(true);
            return true;
          } catch (createError: any) {
            console.error("Auth error:", createError);
            if (createError.code === 'auth/operation-not-allowed') {
              alert("Please enable 'Email/Password' authentication in your Firebase Console -> Authentication -> Sign-in method.");
            }
            return false;
          }
        }
        return false;
      }
    } else {
      // Local fallback
      if (password === 'wedding') {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    }
  };

  const logout = async () => {
    if (isFirebaseEnabled && auth) {
      await auth.signOut();
    }
    setIsAuthenticated(false);
  };

  const updateSettings = async (newSettings: Partial<WeddingSettings>) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    const firestore = db;
    if (isFirebaseEnabled && firestore) {
      try {
        // Use setDoc with merge to safely update or create
        // Only send the changed fields to avoid sending large data unnecessarily
        await setDoc(doc(firestore, 'general', 'settings'), newSettings, { merge: true });
      } catch (error: any) {
        console.error("Failed to save settings to Firebase:", error);
        
        let errorMessage = "Failed to save settings to database.";
        
        if (error.code === 'permission-denied') {
          errorMessage += "\n\nPERMISSION DENIED: Your Firestore Security Rules may be blocking this request. Since this app uses a shared password, you must allow public read/write access in your Firebase Console Rules:\n\nallow read, write: if true;";
        } else if (error.code === 'resource-exhausted') {
          errorMessage += "\n\nQUOTA EXCEEDED: You may have reached your free tier limits or the document is too large.";
        } else if (error.message && error.message.includes("argument")) {
           errorMessage += "\n\nDATA TOO LARGE: The image or text you are trying to save is too big for Firestore. Try a smaller image.";
        } else {
          errorMessage += `\n\nError: ${error.message}`;
        }
        
        alert(errorMessage);
        // Revert optimistic update? 
        // For now, we keep it to avoid UI flickering, but the user knows it failed.
      }
    }
  };

  const addInvitee = async (name: string, title: string) => {
    // Check for duplicates
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = invitees.some(inv => inv.name.trim().toLowerCase() === normalizedName);
    
    if (isDuplicate) {
      throw new Error(`Guest "${name}" already exists.`);
    }

    let slug = name.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) slug = 'guest';

    let uniqueSlug = slug;
    let counter = 1;
    while (invitees.some(inv => inv.slug === uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const newInvitee: Invitee = {
      id: generateId(), // Replaced crypto.randomUUID()
      slug: uniqueSlug,
      name,
      title, // Store title separately
      // Message is intentionally undefined so GuestView uses default
      viewed: false,
      rsvpStatus: 'pending',
      guestCount: 0,
      dietaryRestrictions: '',
      createdAt: Date.now()
    };

    const firestore = db;
    if (isFirebaseEnabled && firestore) {
      try {
        await setDoc(doc(firestore, 'invitees', newInvitee.id), newInvitee);
      } catch (error) {
        console.error("Failed to add invitee:", error);
        alert("Failed to add guest to database.");
      }
    } else {
      setInvitees(prev => [newInvitee, ...prev]);
    }
  };

  const addBatchInvitees = async (guests: { name: string; title: string }[]) => {
    const firestore = db;
    const newInvitees: Invitee[] = [];
    
    // Create a Set of existing slugs to ensure uniqueness during this batch process
    const existingSlugs = new Set(invitees.map(inv => inv.slug));
    const existingNames = new Set(invitees.map(inv => inv.name.trim().toLowerCase()));
    
    const baseTimestamp = Date.now();
    const duplicates: string[] = [];
    
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const normalizedName = guest.name.trim().toLowerCase();
      
      if (existingNames.has(normalizedName)) {
        duplicates.push(guest.name);
        continue;
      }
      
      existingNames.add(normalizedName);

      let slug = guest.name.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!slug) slug = 'guest';

      let uniqueSlug = slug;
      let counter = 1;
      
      // Check against existing AND newly created in this batch
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      
      existingSlugs.add(uniqueSlug);
      
      const newInvitee: Invitee = {
        id: generateId(),
        slug: uniqueSlug,
        name: guest.name,
        title: guest.title,
        viewed: false,
        rsvpStatus: 'pending',
        guestCount: 0,
        dietaryRestrictions: '',
        createdAt: baseTimestamp + i // Increment to preserve order
      };
      
      newInvitees.push(newInvitee);
    }

    if (duplicates.length > 0) {
      throw new Error(`Duplicate guests found: ${duplicates.join(', ')}`);
    }

    if (isFirebaseEnabled && firestore) {
      try {
        const batch = writeBatch(firestore);
        newInvitees.forEach(inv => {
          const ref = doc(firestore, 'invitees', inv.id);
          batch.set(ref, inv);
        });
        await batch.commit();
      } catch (error) {
        console.error("Failed to batch add guests:", error);
        alert("Failed to save batch guests to database.");
      }
    } else {
      setInvitees(prev => [...newInvitees, ...prev]);
    }
  };

  const updateInvitee = async (id: string, data: Partial<Invitee>) => {
    const firestore = db;
    if (isFirebaseEnabled && firestore) {
      try {
        await updateDoc(doc(firestore, 'invitees', id), data);
      } catch (error) {
        console.error("Failed to update invitee:", error);
      }
    } else {
      setInvitees(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
    }
  };

  const deleteInvitee = async (id: string) => {
    const firestore = db;
    if (isFirebaseEnabled && firestore) {
      try {
        await deleteDoc(doc(firestore, 'invitees', id));
      } catch (error) {
        console.error("Failed to delete invitee:", error);
      }
    } else {
      setInvitees(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const getInvitee = (identifier: string) => {
    return invitees.find(inv => inv.id === identifier || inv.slug === identifier);
  };

  return (
    <WeddingContext.Provider value={{
      settings,
      invitees,
      isAuthenticated,
      isLoading,
      login,
      logout,
      updateSettings,
      addInvitee,
      addBatchInvitees,
      updateInvitee,
      deleteInvitee,
      getInvitee
    }}>
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
};

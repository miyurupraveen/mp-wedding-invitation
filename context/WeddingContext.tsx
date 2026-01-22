import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invitee, WeddingContextType, WeddingSettings } from '../types';
import { db, isFirebaseEnabled } from '../firebaseConfig';
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

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

// Local Mock keys
const STORAGE_KEY_SETTINGS = 'eternity_settings';
const STORAGE_KEY_INVITEES = 'eternity_invitees';
const ADMIN_PASSWORD = 'wedding'; 

const defaultSettings: WeddingSettings = {
  inviteImage: null,
  coupleName: 'Anna & James',
  weddingDate: '2024-12-24',
  venueName: 'The Grand Ballroom',
  venueAddress: '123 Celebration Avenue, Wedding City',
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153169!3d-37.816279742021665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d6a32f7f1f81!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1600000000000!5m2!1sen!2sau'
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

    if (isFirebaseEnabled && firestore) {
      // CLOUD MODE: Real-time listeners
      console.log("Wedding Context: Initializing in Cloud Mode (Firebase)");
      
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
      const q = query(collection(firestore, 'invitees'), orderBy('name'));
      const unsubInvitees = onSnapshot(q, (querySnapshot) => {
        const guests: Invitee[] = [];
        querySnapshot.forEach((doc) => {
          guests.push(doc.data() as Invitee);
        });
        setInvitees(guests);
        setLoading(false);
      }, (error) => {
        console.error("Firebase invitees listener failed:", error);
      });

      return () => {
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

  const login = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateSettings = async (newSettings: Partial<WeddingSettings>) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    const firestore = db;
    if (isFirebaseEnabled && firestore) {
      try {
        // Use setDoc with merge to safely update or create
        await setDoc(doc(firestore, 'general', 'settings'), { ...settings, ...newSettings }, { merge: true });
      } catch (error) {
        console.error("Failed to save settings to Firebase:", error);
        alert("Failed to save settings to database. If you are uploading an image, it might be too large even after compression.");
      }
    }
  };

  const addInvitee = async (name: string, title: string) => {
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
      dietaryRestrictions: ''
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
    
    for (const guest of guests) {
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
        dietaryRestrictions: ''
      };
      
      newInvitees.push(newInvitee);
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

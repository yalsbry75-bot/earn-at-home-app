import React, { createContext, useContext, useState, useCallback } from 'react';

interface GuestContextType {
  isGuestMode: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  showRestrictionMessage: (message: string) => void;
  restrictionMessage: string | null;
  clearRestrictionMessage: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState<string | null>(null);

  const enterGuestMode = useCallback(() => {
    setIsGuestMode(true);
    localStorage.setItem('guestMode', 'true');
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuestMode(false);
    localStorage.removeItem('guestMode');
  }, []);

  const showRestrictionMessage = useCallback((message: string) => {
    setRestrictionMessage(message);
  }, []);

  const clearRestrictionMessage = useCallback(() => {
    setRestrictionMessage(null);
  }, []);

  return (
    <GuestContext.Provider
      value={{
        isGuestMode,
        enterGuestMode,
        exitGuestMode,
        showRestrictionMessage,
        restrictionMessage,
        clearRestrictionMessage,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within GuestProvider');
  }
  return context;
}

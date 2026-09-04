import { useContext } from 'react';
import { AppContext } from './AppContext.js';

/**
 * Hook to access the global app state (auth user, active workspace, actions).
 * Must be used inside <AppProvider>.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

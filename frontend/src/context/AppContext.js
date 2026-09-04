import { createContext } from 'react';

// Isolated context instance — imported by AppContext.jsx (provider) and useApp.js (consumer).
export const AppContext = createContext(null);

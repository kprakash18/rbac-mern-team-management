import { createContext } from 'react';
export { useApp } from './useApp.js';

// Isolated context instance — imported by AppContext.jsx (provider) and useApp.js (consumer).
export const AppContext = createContext(null);


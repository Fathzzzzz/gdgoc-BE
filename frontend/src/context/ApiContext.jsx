import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeApiLog } from '../services/api.js';

const ApiContext = createContext(null);
const MAX_LOGS = 20;

export function ApiProvider({ children }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => subscribeApiLog((entry) => {
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));
  }), []);

  return (
    <ApiContext.Provider value={{ logs }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) throw new Error('useApi must be used within an ApiProvider');
  return context;
}
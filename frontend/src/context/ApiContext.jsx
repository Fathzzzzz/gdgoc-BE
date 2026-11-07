import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { subscribeApiLog, getConfiguredBaseUrl, setConfiguredBaseUrl } from '../services/api.js';

const ApiContext = createContext(null);
const MAX_LOGS = 20;

export function ApiProvider({ children }) {
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getConfiguredBaseUrl());
  const [logs, setLogs] = useState([]);

  useEffect(() => subscribeApiLog((entry) => {
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));
  }), []);

  const setApiBaseUrl = useCallback((raw) => {
    const normalized = setConfiguredBaseUrl(raw);
    setApiBaseUrlState(normalized);
  }, []);

  return (
    <ApiContext.Provider value={{ apiBaseUrl, setApiBaseUrl, logs }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) throw new Error('useApi must be used within an ApiProvider');
  return context;
}
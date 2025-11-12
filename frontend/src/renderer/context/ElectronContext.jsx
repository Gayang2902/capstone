import { createContext, useContext, useMemo } from 'react';

const ElectronContext = createContext({});

export const ElectronProvider = ({ children }) => {
  const api = useMemo(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI;
    }
    return {};
  }, []);

  return (
    <ElectronContext.Provider value={api}>
      {children}
    </ElectronContext.Provider>
  );
};

export const useElectronAPI = () => useContext(ElectronContext);

import { createContext, useContext } from 'react';

export const SecurityContext = createContext({
  resetTimer: () => {},
});

export const useSecurityContext = () => useContext(SecurityContext);

export default SecurityContext;

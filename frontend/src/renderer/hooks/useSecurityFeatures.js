import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElectronAPI } from '../context/ElectronContext.jsx';

const getInactivityLimit = () => {
  const raw = localStorage.getItem('autoLockMinutes');
  const minutes = raw ? Number(raw) : 5;
  return Number.isFinite(minutes) ? minutes * 60 * 1000 : 5 * 60 * 1000;
};

export const useSecurityFeatures = () => {
  const electronAPI = useElectronAPI();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const timeout = getInactivityLimit();
    timerRef.current = setTimeout(() => {
      electronAPI?.clearBrowserStorage?.();
      electronAPI?.navigate?.('start');
      navigate('/', { replace: true });
    }, timeout);
  }, [electronAPI, navigate]);

  useEffect(() => {
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handler = () => {
      electronAPI?.userActive?.();
      resetTimer();
    };

    events.forEach((event) => window.addEventListener(event, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [electronAPI, resetTimer]);

  return { resetTimer };
};

export default useSecurityFeatures;

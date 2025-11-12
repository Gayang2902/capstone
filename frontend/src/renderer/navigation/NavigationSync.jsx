import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useElectronAPI } from '../context/ElectronContext.jsx';

const normalizePath = (page) => {
  if (!page) return '/';
  if (page.startsWith('/')) return page;
  return `/${page}`;
};

const NavigationSync = () => {
  const electronAPI = useElectronAPI();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!electronAPI?.onNavigate) return undefined;
    const dispose = electronAPI.onNavigate((page) => {
      const target = normalizePath(page);
      if (location.pathname !== target) {
        navigate(target);
      }
    });
    return () => {
      if (typeof dispose === 'function') dispose();
    };
  }, [electronAPI, navigate, location.pathname]);

  return null;
};

export default NavigationSync;

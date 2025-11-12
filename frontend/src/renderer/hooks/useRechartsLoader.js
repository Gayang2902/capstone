import { useEffect, useState } from 'react';

const CDN_URL = 'https://unpkg.com/recharts@2.12.6/umd/Recharts.min.js';
let loaderPromise = null;

const initialState = () => {
  if (typeof window === 'undefined') {
    return { module: null, status: 'loading', error: null };
  }
  if (window.Recharts) {
    return { module: window.Recharts, status: 'ready', error: null };
  }
  return { module: null, status: 'loading', error: null };
};

const useRechartsLoader = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.Recharts) {
      setState({ module: window.Recharts, status: 'ready', error: null });
      return undefined;
    }

    if (!loaderPromise) {
      loaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = CDN_URL;
        script.async = true;
        script.onload = () => resolve(window.Recharts);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    let isMounted = true;
    loaderPromise
      .then((module) => {
        if (!isMounted) return;
        if (module) {
          setState({ module, status: 'ready', error: null });
        } else {
          setState({
            module: null,
            status: 'error',
            error: new Error('Recharts is unavailable in this environment.'),
          });
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        setState({ module: null, status: 'error', error });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

export default useRechartsLoader;

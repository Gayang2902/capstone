import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useElectronAPI } from './ElectronContext.jsx';

const PasswordContext = createContext(null);

const FAVORITE_WEIGHT = 1000000000000; // large weight to keep favorites on top

const TYPE_ORDER = {
  wifi: 7,
  server: 6,
  bankbook: 5,
  identity: 4,
  security: 3,
  website: 2,
  card: 1,
};

const isFavoriteEntry = (value) => value === true || value === 'true';

const normalizeFavorite = (entry) => (isFavoriteEntry(entry.favorite) ? FAVORITE_WEIGHT : 0);

const getOrderFallback = (entry) => (typeof entry?._orderRank === 'number' ? entry._orderRank : 0);

const getTimestamp = (entry) => {
  const time = new Date(entry?.created_at).getTime();
  if (Number.isFinite(time)) return time;
  return getOrderFallback(entry);
};

const normalizeEntryList = (items = []) => {
  const total = items.length;
  return items.map((item, index) => ({
    ...item,
    favorite: isFavoriteEntry(item.favorite),
    _orderRank: total - index,
  }));
};

const sortEntries = (items = [], mode = 'added', direction = 'desc') => {
  const dir = direction === 'asc' ? 1 : -1;

  switch (mode) {
    case 'name':
      return [...items].sort((a, b) => {
        const aScore = normalizeFavorite(a);
        const bScore = normalizeFavorite(b);
        if (aScore !== bScore) return bScore - aScore;
        const aLabel = a.label || '';
        const bLabel = b.label || '';
        const aStartsWithLetter = /^[A-Za-z가-힣]/.test(aLabel);
        const bStartsWithLetter = /^[A-Za-z가-힣]/.test(bLabel);
        if (aStartsWithLetter && !bStartsWithLetter) return -1;
        if (!aStartsWithLetter && bStartsWithLetter) return 1;
        const effectiveDir = direction === 'desc' ? 1 : -1;
        const compare = effectiveDir * aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' });
        if (compare !== 0) return compare;
        return getOrderFallback(b) - getOrderFallback(a);
      });
    case 'type':
      return [...items].sort((a, b) => {
        const aScore = normalizeFavorite(a);
        const bScore = normalizeFavorite(b);
        if (aScore !== bScore) return bScore - aScore;
        const aOrder = TYPE_ORDER[a.type] ?? Number.MAX_SAFE_INTEGER;
        const bOrder = TYPE_ORDER[b.type] ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return dir * (aOrder - bOrder);
        return dir * (getTimestamp(a) - getTimestamp(b));
      });
    case 'added':
    default:
      return [...items].sort((a, b) => {
        const aScore = normalizeFavorite(a);
        const bScore = normalizeFavorite(b);
        if (aScore !== bScore) return bScore - aScore;
        return dir * (getTimestamp(a) - getTimestamp(b));
      });
  }
};

export const PasswordProvider = ({ children }) => {
  const electronAPI = useElectronAPI();
  const [entries, setEntries] = useState([]);
  const [sortMode, setSortMode] = useState(() => {
    try {
      return localStorage.getItem('password_sort_mode') || 'added';
    } catch {
      return 'added';
    }
  });
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const { t } = useTranslation();

  const refreshEntries = useCallback(async () => {
    if (!electronAPI?.getAllPasswords) return;
    setLoadingEntries(true);
    setEntriesError('');
    try {
      const res = await electronAPI.getAllPasswords();
      if (!res?.status) {
        throw new Error(res?.error_message || t('common.errors.fetchList'));
      }
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setEntries((prev) => {
        const source = list.length ? normalizeEntryList(list) : prev;
        return sortEntries(source, sortMode, sortDirection);
      });
    } catch (error) {
      setEntries([]);
      setEntriesError(error.message || t('common.errors.fetchList'));
    } finally {
      setLoadingEntries(false);
    }
  }, [electronAPI, t, sortMode, sortDirection]);

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('password_sort_mode', sortMode);
    } catch {
      // ignore
    }
    setEntries((prev) => sortEntries(prev, sortMode, sortDirection));
  }, [sortMode, sortDirection]);

  const createEntry = useCallback(
    async (payload) => {
      const res = await electronAPI?.createPasswordEntry?.(payload);
      if (res?.status) {
        await refreshEntries();
      }
      return res;
    },
    [electronAPI, refreshEntries],
  );

  const updateEntry = useCallback(
    async (payload) => {
      const res = await electronAPI?.updatePasswordEntry?.(payload);
      if (res?.status) {
        await refreshEntries();
      }
      return res;
    },
    [electronAPI, refreshEntries],
  );

  const deleteEntry = useCallback(
    async (uid) => {
      const res = await electronAPI?.deletePasswordEntry?.(uid);
      if (res?.status) {
        setEntries((prev) => prev.filter((item) => item.UID !== uid));
      }
      return res;
    },
    [electronAPI],
  );

  const toggleFavorite = useCallback(
    async (entry) => {
      const prevFavorite = isFavoriteEntry(entry.favorite);
      const nextFavorite = !prevFavorite;
      let previousEntries = null;

      setEntries((prev) => {
        previousEntries = prev.map((item) => ({ ...item }));
        const updated = prev.map((item) =>
          item.UID === entry.UID ? { ...item, favorite: nextFavorite } : item,
        );
        return sortEntries(updated, sortMode, sortDirection);
      });

      try {
        const res = await electronAPI?.updatePasswordEntry?.({
          UID: entry.UID,
          favorite: nextFavorite.toString(),
        });
        if (!res?.status) {
          throw new Error(res?.error_message || t('common.errors.updateFailed'));
        }
        return res;
      } catch (error) {
        if (previousEntries) {
          setEntries(previousEntries);
        }
        return { status: false, error_message: error.message };
      }
    },
    [electronAPI, sortMode, sortDirection, t],
  );

  const getPasswordDetail = useCallback(
    (uid) => electronAPI?.getPasswordDetail?.({ UID: uid }),
    [electronAPI],
  );

  const writeClipboard = useCallback(
    (text) => electronAPI?.writeClipboard?.(text),
    [electronAPI],
  );

  const fetchCount = useCallback(() => electronAPI?.getPasswordCount?.(), [electronAPI]);

  const value = useMemo(
    () => ({
      entries,
      loadingEntries,
      entriesError,
      refreshEntries,
      createEntry,
      updateEntry,
      deleteEntry,
      toggleFavorite,
      getPasswordDetail,
      writeClipboard,
      fetchCount,
      sortMode,
      setSortMode,
      sortDirection,
      setSortDirection,
    }),
    [
      entries,
      loadingEntries,
      entriesError,
      refreshEntries,
      createEntry,
      updateEntry,
      deleteEntry,
      toggleFavorite,
      getPasswordDetail,
      writeClipboard,
      fetchCount,
      sortMode,
      setSortMode,
      sortDirection,
      setSortDirection,
    ],
  );

  return <PasswordContext.Provider value={value}>{children}</PasswordContext.Provider>;
};

export const usePasswords = () => {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error('usePasswords는 PasswordProvider 내에서만 사용할 수 있습니다.');
  }
  return context;
};

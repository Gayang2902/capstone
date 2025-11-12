import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import AddEntryModal from '../components/AddEntryModal.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import EntryCard from '../components/EntryCard.jsx';
import { usePasswords } from '../context/PasswordContext.jsx';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Stack,
  Button,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  InputLabel,
  FormControl,
  MenuItem,
  Select,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import { AnimatePresence, motion } from 'framer-motion';

const HomePage = () => {
  const {
    entries,
    loadingEntries,
    entriesError,
    refreshEntries,
    deleteEntry,
    fetchCount,
    sortMode,
    setSortMode,
    sortDirection,
    setSortDirection,
  } = usePasswords();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [count, setCount] = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshLockRef = useRef(false);

  const loadCount = useCallback(async () => {
    try {
      const res = await fetchCount?.();
      if (res?.status && typeof res.data?.total === 'number') {
        setCount(res.data.total);
      }
    } catch {
      setCount(null);
    }
  }, [fetchCount]);

  useEffect(() => {
    loadCount();
  }, [loadCount, entries.length]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter((entry) =>
      Object.values(entry || {}).some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [entries, search]);

  const handleDelete = async (entry) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(t('common.confirmDelete'));
    if (!confirmed) return;
    const res = await deleteEntry(entry.UID);
    if (!res?.status) {
      // eslint-disable-next-line no-alert
      alert(res?.error_message || t('common.errors.delete'));
      return;
    }
    loadCount();
  };

  const totalLabel = useMemo(
    () =>
      t('home.total', {
        count: typeof count === 'number' ? count.toLocaleString() : 0,
      }),
    [count, t],
  );

  const handleRefresh = useCallback(async () => {
    if (refreshLockRef.current) return;
    refreshLockRef.current = true;
    setIsRefreshing(true);
    try {
      await refreshEntries();
      await loadCount();
    } finally {
      refreshLockRef.current = false;
      setIsRefreshing(false);
    }
  }, [refreshEntries, loadCount]);

  const handleSortChange = useCallback(
    (event) => {
      setSortMode?.(event.target.value);
    },
    [setSortMode],
  );

  const handleToggleDirection = useCallback(() => {
    setSortDirection?.((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }, [setSortDirection]);

  const headerExtras = ({ toggleDarkMode, isDarkMode }) => (
    <Stack direction="row" spacing={2} alignItems="center">
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('home.searchPlaceholder')}
        size="small"
        sx={{ minWidth: 240 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <IconButton
        onClick={toggleDarkMode}
        // color="primary"
        // sx={{ bgcolor: 'action.hover', width: 40, height: 40, overflow: 'hidden' }}
        title={t('common.darkModeToggle')}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
              key={isDarkMode ? 'sun' : 'moon'}
              initial={{ scale: 0.4, rotate: isDarkMode ? -120 : 120, opacity: 0 }}
              animate={{ scale: 1.35, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, rotate: isDarkMode ? 120 : -120, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ display: 'inline-flex' }}
          >
            {isDarkMode ? (
                <WbSunnyRoundedIcon fontSize="small" color="warning" />
            ) : (
                <NightsStayRoundedIcon fontSize="small" color="inherit" />
            )}
          </motion.span>
        </AnimatePresence>
      </IconButton>
    </Stack>
  );

  return (
    <AppShell headerExtras={headerExtras} showDefaultDarkToggle={false}>
      <Stack spacing={3}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              {totalLabel}
            </Typography>
            <IconButton color="primary" onClick={handleRefresh} disabled={isRefreshing}>
              <motion.span
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{
                  repeat: isRefreshing ? Infinity : 0,
                  duration: isRefreshing ? 0.8 : 0.3,
                  ease: isRefreshing ? 'linear' : 'easeOut',
                }}
                style={{ display: 'inline-flex' }}
              >
                <RefreshIcon />
              </motion.span>
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setAddModalOpen(true)}
            >
              {t('home.actions.addEntry')}
            </Button>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton size="small" onClick={handleToggleDirection} color="primary">
                <SwapVertIcon
                  sx={{
                    transform: sortDirection === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </IconButton>
              <Box sx={{ minWidth: 160 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="home-sort-select-label">{t('home.actions.sort')}</InputLabel>
                  <Select
                    labelId="home-sort-select-label"
                    id="home-sort-select"
                    value={sortMode}
                    label={t('home.actions.sort')}
                    onChange={handleSortChange}
                  >
                    <MenuItem value="added">{t('home.sort.byAdded')}</MenuItem>
                    <MenuItem value="name">{t('home.sort.byName')}</MenuItem>
                    <MenuItem value="type">{t('home.sort.byType')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {loadingEntries && (
          <Paper sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('common.loading')}
            </Typography>
          </Paper>
        )}

        {!loadingEntries && entriesError && (
          <Paper sx={{ py: 4, textAlign: 'center', bgcolor: 'error.light' }}>
            <Typography color="error.contrastText">{entriesError}</Typography>
          </Paper>
        )}

        {!loadingEntries && !entriesError && filteredEntries.length === 0 && (
          <Paper sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            {t('home.empty')}
          </Paper>
        )}

        {!loadingEntries && !entriesError && filteredEntries.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence initial={false} mode="popLayout">
              {filteredEntries.map((entry) => {
                const isFavorite = entry.favorite === true || entry.favorite === 'true';
                return (
                  <motion.div
                    key={`${entry.UID}-${isFavorite ? 'fav' : 'normal'}`}
                    layout
                    initial={{ opacity: 0, y: isFavorite ? -18 : 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: isFavorite ? -18 : 18 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.8 }}
                    style={{ width: '100%' }}
                  >
                    <EntryCard entry={entry} onEdit={setEditEntry} onDelete={handleDelete} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        )}
      </Stack>

      <AddEntryModal open={isAddModalOpen} onClose={() => setAddModalOpen(false)} />

      <EditEntryModal entry={editEntry} onClose={() => setEditEntry(null)} onUpdated={handleRefresh} />
    </AppShell>
  );
};

export default HomePage;

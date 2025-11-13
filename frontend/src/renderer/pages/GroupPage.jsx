import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from '../components/AppShell.jsx';
import EntryCard from '../components/EntryCard.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import { usePasswords } from '../context/PasswordContext.jsx';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LayoutGroup, motion } from 'framer-motion';

const GROUP_TYPES = [
  { type: 'wifi', icon: 'fa-solid fa-wifi', color: '#6366F1' },
  { type: 'server', icon: 'fa-solid fa-server', color: '#0EA5E9' },
  { type: 'bankbook', icon: 'fa-solid fa-book', color: '#F97316' },
  { type: 'identity', icon: 'fa-solid fa-id-card', color: '#EC4899' },
  { type: 'security', icon: 'fa-solid fa-shield-halved', color: '#22C55E' },
  { type: 'website', icon: 'fa-solid fa-globe', color: '#3B82F6' },
  { type: 'card', icon: 'fa-solid fa-credit-card', color: '#14B8A6' },
];

const sortEntries = (items = []) =>
  [...items].sort((a, b) => {
    const aFav = a.favorite === true || a.favorite === 'true';
    const bFav = b.favorite === true || b.favorite === 'true';
    if (aFav !== bFav) return aFav ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

const GroupPage = () => {
  const { entries, deleteEntry, refreshEntries, loadingEntries } = usePasswords();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  const [editEntry, setEditEntry] = useState(null);

  const counts = useMemo(() => {
    const tally = {};
    entries.forEach((item) => {
      const type = item.type || 'unknown';
      tally[type] = (tally[type] || 0) + 1;
    });
    return tally;
  }, [entries]);

  const modalEntries = useMemo(() => {
    if (!selectedType) return [];
    return sortEntries(entries.filter((item) => item.type === selectedType));
  }, [entries, selectedType]);

  const closeModal = () => {
    setSelectedType(null);
    setEditEntry(null);
  };

  const handleDelete = async (entry) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(t('common.confirmDelete'));
    if (!confirmed) return;
    const res = await deleteEntry(entry.UID);
    if (!res?.status) {
      // eslint-disable-next-line no-alert
      alert(res?.error_message || t('common.errors.delete'));
    }
  };

  const modalTitle = useMemo(() => {
    if (!selectedType) return '';
    return t(`types.${selectedType}`, { defaultValue: selectedType });
  }, [selectedType, t]);

  return (
    <AppShell>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(140px, 1fr))',
            md: 'repeat(3, minmax(180px, 1fr))',
            lg: 'repeat(4, minmax(200px, 1fr))',
          },
          maxWidth: 960,
          mx: 'auto',
          mt: 3,
        }}
      >
        {GROUP_TYPES.map(({ type, icon, color }) => (
          <Box
            key={type}
            sx={{
              position: 'relative',
              width: '100%',
              paddingTop: '100%',
            }}
          >
            <Card
              elevation={0}
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: 5,
                backgroundColor: color,
                color: 'common.white',
                boxShadow: '0 18px 30px rgba(15,23,42,0.2)',
                display: 'flex',
              }}
            >
              <CardActionArea
                onClick={() => setSelectedType(type)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  p: { xs: 2, md: 3 },
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box component="i" className={`${icon}`} sx={{ fontSize: { xs: 36, md: 44 } }} />
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
                    {t(`types.${type}`)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('group.count', { count: (counts[type] ?? 0).toLocaleString() })}
                 </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>

      <Dialog
        open={Boolean(selectedType)}
        onClose={closeModal}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">{modalTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('group.modal.total', { count: modalEntries.length.toLocaleString() })}
            </Typography>
          </Box>
          <IconButton onClick={closeModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingEntries && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {!loadingEntries && modalEntries.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('group.empty')}</Typography>
            </Box>
          )}

          {!loadingEntries && modalEntries.length > 0 && (
            <LayoutGroup id={`group-modal-${selectedType || 'unknown'}`}>
              <Stack spacing={2} component={motion.div} layout>
                {modalEntries.map((entry, index) => {
                  const key = entry.UID ?? `${selectedType}-${index}`;
                  return (
                    <motion.div
                      key={key}
                      layout
                      layoutId={`group-entry-${key}`}
                      transition={{
                        layout: { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 },
                      }}
                      style={{ width: '100%' }}
                    >
                      <EntryCard entry={entry} onEdit={setEditEntry} onDelete={handleDelete} />
                    </motion.div>
                  );
                })}
              </Stack>
            </LayoutGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>{t('common.actions.close')}</Button>
        </DialogActions>
      </Dialog>

      <EditEntryModal entry={editEntry} onClose={() => setEditEntry(null)} onUpdated={refreshEntries} />
    </AppShell>
  );
};

export default GroupPage;

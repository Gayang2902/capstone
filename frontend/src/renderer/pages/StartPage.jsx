import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useElectronAPI } from '../context/ElectronContext.jsx';
import { usePasswords } from '../context/PasswordContext.jsx';
import {
  Box,
  Container,
  Paper,
  Stack,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const STORAGE_KEY = 'filePaths';

const StartPage = () => {
  const electronAPI = useElectronAPI();
  const { refreshEntries } = usePasswords();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filePaths, setFilePaths] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [masterKey, setMasterKey] = useState('');
  const [status, setStatus] = useState({ tone: 'neutral', message: '' });
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ui.darkMode');
      const root = document.documentElement;
      if (stored === 'true') {
        root.classList.add('dark');
      } else if (stored === 'false') {
        root.classList.remove('dark');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    electronAPI?.allowScreenshot?.();
    return () => {
      electronAPI?.preventScreenshot?.();
    };
  }, [electronAPI]);

  useEffect(() => {
    if (filePaths.length === 0) {
      setCurrentIndex(-1);
      return;
    }
    setCurrentIndex((idx) => (idx >= 0 && idx < filePaths.length ? idx : 0));
  }, [filePaths.length]);

  useEffect(() => {
    if (!electronAPI?.openFilePath) return;
    if (currentIndex < 0 || currentIndex >= filePaths.length) return;
    const targetPath = filePaths[currentIndex];
    let cancelled = false;

    const open = async () => {
      try {
        setIsLoading(true);
        setStatus({ tone: 'neutral', message: '' });
        const res = await electronAPI.openFilePath(targetPath);
        if (!res?.status) {
          if (!cancelled) {
            setStatus({
              tone: 'error',
              message: res?.error_message || t('start.errors.openFailed'),
            });
            setFilePaths((prev) => prev.filter((path) => path !== targetPath));
          }
        } else if (!cancelled) {
          setMasterKey('');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ tone: 'error', message: t('start.errors.pickWithReason', { message: error.message }) });
          setFilePaths((prev) => prev.filter((path) => path !== targetPath));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    open();

    return () => {
      cancelled = true;
    };
  }, [electronAPI, currentIndex, filePaths, t]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filePaths));
  }, [filePaths]);

  const canAuthenticate = masterKey.trim() !== '' && currentIndex >= 0 && !isLoading;

  const statusClassName = useMemo(() => {
    switch (status.tone) {
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-slate-500';
    }
  }, [status.tone]);

  const handleOpenFile = useCallback(async () => {
    if (!electronAPI?.openFile) return;
    try {
      setIsLoading(true);
      const res = await electronAPI.openFile();
      if (res?.status && res.file_path) {
        setFilePaths((prev) => {
          if (prev.includes(res.file_path)) return prev;
          return [...prev, res.file_path];
        });
        const existingIndex = filePaths.indexOf(res.file_path);
        setCurrentIndex(existingIndex !== -1 ? existingIndex : filePaths.length);
      } else if (res?.error_message) {
        setStatus({ tone: 'error', message: res.error_message });
      }
    } catch (error) {
      setStatus({ tone: 'error', message: t('start.errors.openWithReason', { message: error.message }) });
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI, filePaths, t]);

  const handleCreateFile = useCallback(async () => {
    if (!electronAPI?.createFile) return;
    try {
      setIsLoading(true);
      const res = await electronAPI.createFile();
      if (res?.status && res.file_path) {
        setFilePaths([res.file_path]);
        setStatus({ tone: 'success', message: t('start.status.created') });
        setCurrentIndex(0);
      } else if (res?.error_message) {
        setStatus({ tone: 'error', message: res.error_message });
      }
    } catch (error) {
      setStatus({ tone: 'error', message: t('start.errors.createWithReason', { message: error.message }) });
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI, t]);

  const handleDeleteFilePath = useCallback(
    (idx) => {
      setFilePaths((prev) => prev.filter((_, i) => i !== idx));
      if (currentIndex === idx) {
        setCurrentIndex(-1);
      } else if (currentIndex > idx) {
        setCurrentIndex((value) => value - 1);
      }
    },
    [currentIndex],
  );

  const handleAuthenticate = useCallback(async () => {
    if (!electronAPI?.postMasterKey || !canAuthenticate) return;
    try {
      setIsLoading(true);
      setStatus({ tone: 'neutral', message: '' });
      const response = await electronAPI.postMasterKey(masterKey.trim());
      if (response?.status) {
        setStatus({ tone: 'success', message: t('start.status.authSuccess') });
        setMasterKey('');
        await refreshEntries?.();
        electronAPI.navigate?.('home');
        navigate('/home', { replace: true });
      } else {
        const msg = response?.error_message || t('start.errors.authFailed');
        setStatus({ tone: 'error', message: msg });
      }
    } catch (error) {
      setStatus({ tone: 'error', message: t('start.errors.authWithReason', { message: error.message }) });
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI, canAuthenticate, masterKey, navigate, refreshEntries, t]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && canAuthenticate) {
        event.preventDefault();
        handleAuthenticate();
      }
    },
    [canAuthenticate, handleAuthenticate],
  );

  useEffect(() => {
    if (currentIndex >= 0 && !isLoading) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isLoading]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        transition: 'background-color 0.3s ease',
        p: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box
            sx={{
              background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 100%)',
              color: 'common.white',
              textAlign: 'center',
              py: 4,
              px: 3,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <LockIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold">
                {t('common.appName')}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
              {t('start.placeholder.masterKey')}
            </Typography>
          </Box>

          <Stack spacing={3} sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<FolderOpenIcon />}
                onClick={handleOpenFile}
                disabled={isLoading}
              >
                {t('start.actions.openFile')}
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<CreateNewFolderIcon />}
                onClick={handleCreateFile}
                disabled={isLoading}
              >
                {t('start.actions.createFile')}
              </Button>
            </Stack>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t('start.header')}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                }}
              >
                <List dense disablePadding>
                  {filePaths.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ width: '100%' }}>
                            {t('start.empty')}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                  {filePaths.map((filePath, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <ListItem
                        key={filePath}
                        disablePadding
                        secondaryAction={
                          <IconButton edge="end" color="error" onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteFilePath(idx);
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          selected={isActive}
                          onClick={() => {
                            setStatus({ tone: 'neutral', message: '' });
                            setCurrentIndex(idx);
                          }}
                        >
                          <ListItemText primary={filePath} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
              <TextField
                fullWidth
                id="input-master-key"
                inputRef={inputRef}
                type={isPasswordVisible ? 'text' : 'password'}
                value={masterKey}
                disabled={isLoading || currentIndex < 0}
                onChange={(event) => {
                  setMasterKey(event.target.value);
                  setStatus({ tone: 'neutral', message: '' });
                }}
                onKeyDown={handleKeyDown}
                label={t('start.placeholder.masterKey')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setPasswordVisible((prev) => !prev)}
                        edge="end"
                        aria-label={isPasswordVisible ? t('start.aria.hidePassword') : t('start.aria.showPassword')}
                      >
                        {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAuthenticate}
                disabled={!canAuthenticate}
                sx={{ minWidth: 160 }}
              >
                {isLoading ? t('common.processing') : t('start.actions.authenticate')}
              </Button>
            </Stack>

            <Divider />
            <Typography
              variant="body2"
              color={
                status.tone === 'error'
                  ? 'error.main'
                  : status.tone === 'success'
                    ? 'success.main'
                    : 'text.secondary'
              }
              minHeight={24}
            >
              {status.message}
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default StartPage;

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from '../components/AppShell.jsx';
import { useElectronAPI } from '../context/ElectronContext.jsx';
import { useSecurityContext } from '../context/SecurityContext.jsx';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const AUTO_LOCK_VALUES = ['1', '3', '5', '10', '30'];

const SettingPage = () => {
  const electronAPI = useElectronAPI();
  const { resetTimer } = useSecurityContext();
  const { t } = useTranslation();
  const [dbPath, setDbPath] = useState('');
  const [oldMaster, setOldMaster] = useState('');
  const [newMaster, setNewMaster] = useState('');
  const [oldVisible, setOldVisible] = useState(false);
  const [newVisible, setNewVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState('neutral');
  const [autoLock, setAutoLock] = useState(() => localStorage.getItem('autoLockMinutes') || '5');
  const [zkpUsername, setZkpUsername] = useState('');
  const [zkpPassword, setZkpPassword] = useState('');
  const [zkpPasswordVisible, setZkpPasswordVisible] = useState(false);
  const [zkpStatus, setZkpStatus] = useState({ tone: 'neutral', message: '' });
  const [zkpLoading, setZkpLoading] = useState(false);

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const res = await electronAPI?.getFilePath?.();
        if (res?.status && res.file_path) {
          setDbPath(res.file_path);
        } else {
          setDbPath(t('setting.status.noPath'));
        }
      } catch (error) {
        console.error('Failed to get file path', error);
        setDbPath(t('setting.status.noPath'));
      }
    };
    fetchPath();
  }, [electronAPI, t]);

  const setMessage = (tone, message) => {
    setStatusTone(tone);
    setStatusMessage(message);
  };

  const handleAutoLockChange = (event) => {
    const value = event.target.value;
    setAutoLock(value);
    localStorage.setItem('autoLockMinutes', value);
    resetTimer();
  };

  const handleMasterChange = async () => {
    if (!oldMaster.trim()) {
      setMessage('error', t('setting.errors.oldRequired'));
      return;
    }
    if (!newMaster.trim()) {
      setMessage('error', t('setting.errors.newRequired'));
      return;
    }
    try {
      const res = await electronAPI?.updateMasterKey?.(oldMaster.trim(), newMaster.trim());
      if (!res?.status) {
        throw new Error(res?.error_message || t('setting.errors.changeFailed'));
      }
      setMessage('success', t('setting.status.masterChanged'));
      setOldMaster('');
      setNewMaster('');
      setOldVisible(false);
      setNewVisible(false);
    } catch (error) {
      console.error('Failed to update master key', error);
      setMessage('error', error.message);
    }
  };

  const runZkpAction = async (action, successResolver) => {
    if (!electronAPI) return;
    setZkpLoading(true);
    setZkpStatus({ tone: 'neutral', message: '' });
    try {
      const result = await action();
      if (!result?.status) {
        throw new Error(result?.error_message || t('setting.errors.zkpGeneric'));
      }
      const message =
        typeof successResolver === 'function'
          ? successResolver(result)
          : successResolver || result.message || t('setting.status.zkpSuccess');
      setZkpStatus({ tone: 'success', message });
    } catch (error) {
      setZkpStatus({ tone: 'error', message: error.message || t('setting.errors.zkpGeneric') });
    } finally {
      setZkpLoading(false);
    }
  };

  const handleZkpSignup = () => {
    if (!zkpUsername.trim() || !zkpPassword.trim()) {
      setZkpStatus({ tone: 'error', message: t('setting.errors.credentialsRequired') });
      return;
    }
    runZkpAction(
      () => electronAPI?.zkpSignup?.(zkpUsername.trim(), zkpPassword),
      t('setting.status.zkpSignedUp')
    );
  };

  const handleZkpLogin = () => {
    if (!zkpUsername.trim() || !zkpPassword.trim()) {
      setZkpStatus({ tone: 'error', message: t('setting.errors.credentialsRequired') });
      return;
    }
    runZkpAction(
      () => electronAPI?.zkpLogin?.(zkpUsername.trim(), zkpPassword),
      t('setting.status.zkpLoggedIn')
    );
  };

  const handleZkpUpload = () => {
    runZkpAction(
      () => electronAPI?.zkpUpload?.(),
      t('setting.status.zkpUploaded')
    );
  };

  const handleZkpDownload = () => {
    runZkpAction(
      () => electronAPI?.zkpDownload?.(),
      (res) => t('setting.status.zkpDownloaded', { path: res?.file_path || '' })
    );
  };

  const hasCredentials = zkpUsername.trim() !== '' && zkpPassword.trim() !== '';

  return (
    <AppShell>
      <Stack spacing={3} maxWidth="md" mx="auto">
        <Card variant="outlined">
          <CardHeader
            title={t('setting.titles.database')}
          />
          <CardContent>
            <Stack spacing={3}>
              <TextField
                label={t('setting.labels.databasePath')}
                value={dbPath}
                InputProps={{ readOnly: true }}
                fullWidth
              />

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {t('setting.labels.changeMaster')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('setting.labels.currentPassword')}
                      type={oldVisible ? 'text' : 'password'}
                      value={oldMaster}
                      onChange={(event) => setOldMaster(event.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setOldVisible((prev) => !prev)}>
                              {oldVisible ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('setting.labels.newPassword')}
                      type={newVisible ? 'text' : 'password'}
                      value={newMaster}
                      onChange={(event) => setNewMaster(event.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setNewVisible((prev) => !prev)}>
                              {newVisible ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button variant="contained" onClick={handleMasterChange}>
                    {t('setting.actions.change')}
                  </Button>
                </Box>
                {statusMessage && (
                  <Alert
                    severity={statusTone === 'error' ? 'error' : statusTone === 'success' ? 'success' : 'info'}
                    sx={{ mt: 2 }}
                  >
                    {statusMessage}
                  </Alert>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  {t('setting.labels.autoLock')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
                    {t('setting.labels.inactive')}
                  </Typography>
                  <TextField select value={autoLock} onChange={handleAutoLockChange} sx={{ minWidth: 160 }}>
                    {AUTO_LOCK_VALUES.map((value) => (
                      <MenuItem key={value} value={value}>
                        {t('setting.autoLock.minutes', { count: Number(value) })}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t('setting.hints.autoLock')}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader title={t('setting.titles.transfer')} />
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t('setting.hints.transfer')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('setting.labels.zkpUsername')}
                    value={zkpUsername}
                    onChange={(event) => setZkpUsername(event.target.value)}
                    disabled={zkpLoading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('setting.labels.zkpPassword')}
                    type={zkpPasswordVisible ? 'text' : 'password'}
                    value={zkpPassword}
                    onChange={(event) => setZkpPassword(event.target.value)}
                    disabled={zkpLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setZkpPasswordVisible((prev) => !prev)}>
                            {zkpPasswordVisible ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    disabled={!hasCredentials || zkpLoading}
                    onClick={handleZkpSignup}
                  >
                    {t('setting.actions.zkpSignup')}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!hasCredentials || zkpLoading}
                    onClick={handleZkpLogin}
                  >
                    {t('setting.actions.zkpLogin')}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    disabled={zkpLoading}
                    onClick={handleZkpUpload}
                  >
                    {t('setting.actions.zkpUpload')}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    disabled={zkpLoading}
                    onClick={handleZkpDownload}
                  >
                    {t('setting.actions.zkpDownload')}
                  </Button>
                </Grid>
              </Grid>
              {zkpStatus.message && (
                <Alert
                  severity={
                    zkpStatus.tone === 'error'
                      ? 'error'
                      : zkpStatus.tone === 'success'
                        ? 'success'
                        : 'info'
                  }
                  sx={{ mt: 1 }}
                >
                  {zkpStatus.message}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </AppShell>
  );
};

export default SettingPage;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { fieldConfig, typeIconClasses } from '../constants/passwordSchemas.js';
import { usePasswords } from '../context/PasswordContext.jsx';

const ICON_FALLBACK = 'fa-solid fa-key text-gray-500';
const COPY_FEEDBACK_DURATION = 2000;

const buildFaviconUrl = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const { origin } = new URL(normalized);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(origin)}`;
  } catch {
    return null;
  }
};

const EntryCard = ({ entry, onEdit, onDelete, enableWebsiteFavicon = false }) => {
  const { toggleFavorite, getPasswordDetail, writeClipboard } = usePasswords();
  const { t } = useTranslation();
  const [passwordValue, setPasswordValue] = useState(null);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isLoadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const copyFeedbackTimeout = useRef(null);
  const fields = fieldConfig[entry.type] || [];
  const isFavorite = entry.favorite === true || entry.favorite === 'true';
  const [faviconError, setFaviconError] = useState(false);

  const iconClass = typeIconClasses[entry.type] || ICON_FALLBACK;

  const isWebsiteEntry = useMemo(() => enableWebsiteFavicon && entry.type === 'website', [
    enableWebsiteFavicon,
    entry.type,
  ]);

  const faviconUrl = useMemo(() => {
    if (!isWebsiteEntry) return null;
    const rawUrl =
      entry?.url ||
      entry?.URL ||
      entry?.link ||
      entry?.homepage ||
      entry?.domain ||
      entry?.site ||
      entry?.address;
    return buildFaviconUrl(rawUrl);
  }, [
    isWebsiteEntry,
    entry?.url,
    entry?.URL,
    entry?.link,
    entry?.homepage,
    entry?.domain,
    entry?.site,
    entry?.address,
  ]);

  useEffect(() => {
    setFaviconError(false);
  }, [faviconUrl, entry?.UID]);

  const showFavicon = Boolean(faviconUrl) && !faviconError;

  const fetchPassword = useCallback(async () => {
    if (passwordValue) return passwordValue;
    if (!entry?.UID) return null;
    try {
      setLoadingPassword(true);
      setPasswordError('');
      const res = await getPasswordDetail(entry.UID);
      if (res?.status && res.data?.pwd) {
        setPasswordValue(res.data.pwd);
        return res.data.pwd;
      }
      setPasswordError(res?.error_message || t('entry.actions.unavailable'));
    } catch (error) {
      console.error('Failed to fetch password detail', error);
      setPasswordError(t('entry.actions.unavailable'));
    } finally {
      setLoadingPassword(false);
    }
    return null;
  }, [entry?.UID, getPasswordDetail, passwordValue, t]);

  const handleCopy = useCallback(
      async (value) => {
        try {
          await writeClipboard?.(value);
          setCopyFeedback(t('entry.actions.copied'));
          if (copyFeedbackTimeout.current) {
            clearTimeout(copyFeedbackTimeout.current);
          }
          copyFeedbackTimeout.current = setTimeout(() => {
            setCopyFeedback('');
          }, COPY_FEEDBACK_DURATION);
        } catch (error) {
          console.error('Clipboard write failed', error);
        }
      },
      [writeClipboard, t],
  );

  const handlePasswordHover = useCallback(async () => {
    if (!passwordValue && !isLoadingPassword) {
      const pwd = await fetchPassword();
      setPasswordVisible(Boolean(pwd));
    } else if (passwordValue) {
      setPasswordVisible(true);
    }
  }, [passwordValue, isLoadingPassword, fetchPassword]);

  const handlePasswordClick = useCallback(async () => {
    const pwd = await fetchPassword();
    if (!pwd) return;
    setPasswordVisible(true);
    await handleCopy(pwd);
  }, [fetchPassword, handleCopy]);

  useEffect(
      () => () => {
        if (copyFeedbackTimeout.current) {
          clearTimeout(copyFeedbackTimeout.current);
        }
      },
      [],
  );

  return (
      <Card
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 4,
            boxShadow: '0 18px 35px rgba(15,23,42,0.08)',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
      >
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" minWidth={0}>
            <Avatar
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                  width: 60,
                  height: 60,
                  fontSize: 24,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
            >
              {showFavicon ? (
                  <Box
                      component="img"
                      src={faviconUrl}
                      alt={entry.label || 'website favicon'}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setFaviconError(true)}
                      sx={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                      }}
                  />
              ) : (
                  <Box component="i" className={iconClass} />
              )}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="h6" noWrap>
                {entry.label || entry.type}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {entry.created_at}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                <Chip size="small" color="primary" variant="outlined" label={entry.type} />
                {entry.username && <Chip size="small" label={entry.username} />}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title={t('entry.actions.toggleFavorite')}>
              <IconButton color={isFavorite ? 'warning' : 'default'} onClick={() => toggleFavorite(entry)}>
                <Box component="i" className={`fa-star ${isFavorite ? 'fa-solid' : 'fa-regular'}`} />
              </IconButton>
            </Tooltip>
            <Button
                variant="outlined"
                startIcon={<Box component="i" className="fa-solid fa-pen" />}
                onClick={() => onEdit?.(entry)}
            >
              {t('common.actions.edit')}
            </Button>
            <Button
                variant="contained"
                color="error"
                startIcon={<Box component="i" className="fa-solid fa-trash" />}
                onClick={() => onDelete?.(entry)}
            >
              {t('common.actions.delete')}
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Stack direction="row" flexWrap="wrap" spacing={1.5}>
          {fields.map(({ key, labelKey }) => {
            const rawValue = entry[key];
            if (key !== 'pwd' && (rawValue == null || rawValue === '')) return null;

            if (key === 'pwd') {
              return (
                  <Stack key={key} spacing={0.5}>
                    <Button
                        color="primary"
                        variant="outlined"
                        onMouseEnter={handlePasswordHover}
                        onFocus={handlePasswordHover}
                        onMouseLeave={() => setPasswordVisible(false)}
                        onBlur={() => setPasswordVisible(false)}
                        onClick={handlePasswordClick}
                        sx={{ textTransform: 'none', fontFamily: 'monospace', minWidth: 260 }}
                    >
                      <Typography component="span" fontWeight={600} sx={{ mr: 1 }}>
                        {t(labelKey)}
                      </Typography>
                      {isLoadingPassword
                          ? t('entry.actions.loading')
                          : isPasswordVisible && passwordValue
                              ? passwordValue
                              : '••••••'}
                    </Button>
                    {passwordError && (
                        <Typography variant="caption" color="error">
                          {passwordError}
                        </Typography>
                    )}
                  </Stack>
              );
            }

            return (
                <Button
                    key={key}
                    variant="text"
                    onClick={() => handleCopy(rawValue)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 3,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      px: 2,
                      minWidth: 200,
                    }}
                >
                  <Typography component="span" fontWeight={600} color="primary.main" sx={{ mr: 1 }}>
                    {t(labelKey)}
                  </Typography>
                  <Typography component="span" sx={{ flex: 1 }} noWrap>
                    {rawValue}
                  </Typography>
                </Button>
            );
          })}
        </Stack>

        {copyFeedback && (
            <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>
              {copyFeedback}
            </Alert>
        )}

        {entry.comments && (
            <Typography
                variant="body2"
                sx={{
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  p: 2,
                }}
            >
              {entry.comments}
            </Typography>
        )}
      </Card>
  );
};

export default EntryCard;

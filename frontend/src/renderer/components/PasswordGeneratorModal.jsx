import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useElectronAPI } from '../context/ElectronContext.jsx';
import usePasswordGenerator from '../hooks/usePasswordGenerator.js';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const PasswordGeneratorModal = ({ open, onClose }) => {
  const electronAPI = useElectronAPI();
  const {
    length,
    setLength,
    options,
    toggleOption,
    updateOption,
    password,
    regenerate,
    strength,
    DEFAULT_SYMBOLS,
  } = usePasswordGenerator();
  const [copyFeedback, setCopyFeedback] = useState('');
  const [copyStatus, setCopyStatus] = useState('success');
  const { t } = useTranslation();

  const hasCharacterPool =
    options.includeLower || options.includeUpper || options.includeNumber || options.includeSymbol;

  const isGenerateDisabled = !hasCharacterPool && !options.includeWord;

  useEffect(() => {
    if (open) {
      regenerate();
      setCopyFeedback('');
      setCopyStatus('success');
    }
  }, [open, regenerate]);

  useEffect(() => {
    if (!open) {
      setCopyFeedback('');
    }
  }, [open]);

  const suggestions = strength?.suggestions || [];

  const handleCopy = async () => {
    if (!password) return;
    try {
      await electronAPI?.writeClipboard?.(password);
      setCopyFeedback(t('generator.status.copySuccess'));
      setCopyStatus('success');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (error) {
      console.error('Failed to copy password:', error);
      setCopyFeedback(t('generator.status.copyError'));
      setCopyStatus('error');
    }
  };

  const handleRegenerate = () => {
    regenerate();
    setCopyFeedback('');
    setCopyStatus('success');
  };

  const barColor = useMemo(() => {
    const cls = strength?.barClass || '';
    if (cls.includes('green') || cls.includes('emerald')) return 'success.main';
    if (cls.includes('yellow')) return 'warning.main';
    if (cls.includes('indigo') || cls.includes('blue')) return 'primary.main';
    return 'error.main';
  }, [strength?.barClass]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{t('generator.title')}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{t('generator.length')}</Typography>
              <Typography variant="subtitle2" color="primary">
                {length}
              </Typography>
            </Stack>
            <Slider
              value={length}
              onChange={(_, value) => setLength(Array.isArray(value) ? value[0] : value)}
              min={4}
              max={32}
              step={1}
              valueLabelDisplay="auto"
              sx={{ mt: 1 }}
            />
          </Stack>

          <Grid container spacing={1}>
            {[
              { key: 'includeLower', label: t('generator.options.includeLower') },
              { key: 'includeUpper', label: t('generator.options.includeUpper') },
              { key: 'includeNumber', label: t('generator.options.includeNumber') },
              { key: 'includeSymbol', label: t('generator.options.includeSymbol') },
              { key: 'includeWord', label: t('generator.options.includeWord') },
            ].map(({ key, label }) => (
              <Grid item xs={6} key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options[key]}
                      onChange={() => toggleOption(key)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2">{label}</Typography>}
                />
              </Grid>
            ))}
          </Grid>

          {options.includeSymbol && (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{t('generator.customSymbols.label')}</Typography>
                <Button size="small" onClick={() => updateOption('customSymbols', DEFAULT_SYMBOLS)}>
                  {t('generator.customSymbols.reset')}
                </Button>
              </Stack>
              <TextField
                multiline
                minRows={2}
                value={options.customSymbols}
                onChange={(event) => updateOption('customSymbols', event.target.value)}
                placeholder="!@#$%"
              />
              <Typography variant="caption" color="text.secondary">
                {t('generator.customSymbols.hint')}
              </Typography>
            </Stack>
          )}

          <Stack spacing={1}>
            <TextField
              value={password}
              InputProps={{ readOnly: true }}
              fullWidth
              label={t('generator.result')}
            />
            <LinearProgress
              variant="determinate"
              value={strength.percent}
              sx={{
                height: 10,
                borderRadius: 5,
                '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: barColor },
              }}
            />
            {strength.labelKey && (
              <Typography variant="body2">{t(strength.labelKey)}</Typography>
            )}
            {suggestions.length > 0 && (
              <Stack spacing={1}>
                {suggestions.map((tip) => (
                  <Alert key={tip} severity="info" icon={false} sx={{ py: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box component="i" className="fa-solid fa-lightbulb" />
                      <Typography variant="caption">{t(tip)}</Typography>
                    </Stack>
                  </Alert>
                ))}
              </Stack>
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleRegenerate}
              disabled={isGenerateDisabled}
            >
              {t('generator.actions.generate')}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={handleRegenerate}
              disabled={isGenerateDisabled}
            >
              {t('generator.actions.refresh')}
            </Button>
            <Button variant="contained" color="success" fullWidth onClick={handleCopy}>
              {t('generator.actions.copy')}
            </Button>
          </Stack>

          {!hasCharacterPool && !options.includeWord && (
            <Alert severity="error" variant="outlined">
              {t('generator.errors.requirePool')}
            </Alert>
          )}
          {copyFeedback && <Alert severity={copyStatus}>{copyFeedback}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.actions.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordGeneratorModal;

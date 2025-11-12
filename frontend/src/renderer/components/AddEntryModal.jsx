import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alpha } from '@mui/material/styles';
import { fieldConfig, typeIconClasses, typeAccentColors } from '../constants/passwordSchemas.js';
import { usePasswords } from '../context/PasswordContext.jsx';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const AddEntryModal = ({ open, onClose, onSuccess }) => {
  const { createEntry } = usePasswords();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [label, setLabel] = useState('');
  const [comments, setComments] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState({});

  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setFormValues({});
      setLabel('');
      setComments('');
      setIsFavorite(false);
      setError('');
      setVisibleFields({});
    }
  }, [open]);

  const fields = useMemo(() => (selectedType ? fieldConfig[selectedType] || [] : []), [selectedType]);

  const handleSave = async () => {
    if (!selectedType) {
      setError(t('addEntry.errors.selectType'));
      return;
    }
    if (!label.trim()) {
      setError(t('common.errors.labelRequired'));
      return;
    }
    for (const field of fields) {
      const value = formValues[field.key];
      if (value == null || value.toString().trim() === '') {
        setError(t('addEntry.errors.fillAll'));
        return;
      }
    }
    try {
      setIsSaving(true);
      setError('');
      const payload = {
        type: selectedType,
        label: label.trim(),
        favorite: isFavorite.toString(),
        comments: comments.trim(),
      };
      fields.forEach(({ key }) => {
        payload[key] = (formValues[key] || '').toString().trim();
      });
      const response = await createEntry(payload);
      if (!response?.status) {
        const msg = response?.error_message || t('common.errors.saveFailed');
        setError(msg);
        return;
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || t('common.errors.saveGeneric'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{t('addEntry.title')}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        {!selectedType ? (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              gap: 1.5,
              overflow: 'hidden',
              justifyContent: 'space-between',
            }}
          >
            {Object.keys(fieldConfig).map((type) => {
              const IconClass = typeIconClasses[type] || 'fa-solid fa-key';
              const accentColor = typeAccentColors[type];
              const renderStyles = (theme) => {
                const color = accentColor || theme.palette.primary.main;
                return {
                  minWidth: 110,
                  maxWidth: 140,
                  flex: '1 1 auto',
                  borderRadius: 3,
                  px: 2,
                  py: 2.5,
                  border: `2px solid ${type === selectedType ? color : theme.palette.divider}`,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  bgcolor: alpha(color, type === selectedType ? 0.18 : 0.08),
                  '&:hover': {
                    borderColor: color,
                    bgcolor: alpha(color, 0.15),
                  },
                };
              };
              return (
                <Paper
                  key={type}
                  component={ButtonBase}
                  onClick={() => setSelectedType(type)}
                  sx={renderStyles}
                  >
                    <Box
                      component="i"
                      className={IconClass}
                      sx={{
                        fontSize: 22,
                        color: (theme) => accentColor || theme.palette.primary.main,
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    sx={{ color: (theme) => accentColor || theme.palette.text.primary }}
                      noWrap
                    >
                      {t(`types.${type}`, { defaultValue: type })}
                    </Typography>
                  </Paper>
                );
            })}
          </Box>
        ) : (
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button onClick={() => setSelectedType(null)} size="small">
                <NavigateBeforeIcon />
              </Button>
              <Typography
                variant="body2"
                color="primary"
                sx={{ flex: 1, textAlign: 'right' }}
              >
                {t('addEntry.selectedType', {
                  type: t(`types.${selectedType}`, { defaultValue: selectedType }),
                })}
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                label={t('addEntry.placeholder.label')}
              />
              <IconButton color={isFavorite ? 'warning' : 'default'} onClick={() => setIsFavorite((prev) => !prev)}>
                {isFavorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Stack>

            <Grid container spacing={2}>
              {fields.map(({ key, labelKey }) => {
                const isPasswordField = key === 'pwd';
                const isVisible = Boolean(visibleFields[key]);
                return (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      fullWidth
                      type={isPasswordField && !isVisible ? 'password' : 'text'}
                      label={t(labelKey)}
                      value={formValues[key] ?? ''}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [key]: event.target.value,
                        }))
                      }
                      InputProps={
                        isPasswordField
                          ? {
                              endAdornment: (
                                <IconButton
                                  edge="end"
                                  onClick={() =>
                                    setVisibleFields((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }))
                                  }
                                >
                                  {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              ),
                            }
                          : undefined
                      }
                    />
                  </Grid>
                );
              })}
            </Grid>

            <TextField
              label={t('common.fields.comments')}
              multiline
              minRows={3}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || !selectedType}
        >
          {isSaving ? t('common.actions.saving') : t('common.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEntryModal;

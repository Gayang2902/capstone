import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fieldConfig } from '../constants/passwordSchemas.js';
import { usePasswords } from '../context/PasswordContext.jsx';
import {
  Alert,
  Button,
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const EditEntryModal = ({ entry, onClose, onUpdated }) => {
  const { updateEntry, getPasswordDetail } = usePasswords();
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [comments, setComments] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState({});

  const fields = useMemo(() => {
    if (!entry?.type) return [];
    return fieldConfig[entry.type] || [];
  }, [entry]);

  useEffect(() => {
    if (!entry) return;
    setLabel(entry.label ?? '');
    setComments(entry.comments ?? '');
    setIsFavorite(entry.favorite === true || entry.favorite === 'true');
    setVisibleFields({});
    const nextValues = {};
    (fieldConfig[entry.type] || []).forEach(({ key }) => {
      nextValues[key] = entry[key] ?? '';
    });
    setFormValues(nextValues);
    setError('');

    if (entry.UID) {
      getPasswordDetail(entry.UID)
        .then((res) => {
          if (res?.status && res.data?.pwd) {
            setFormValues((prev) => ({
              ...prev,
              pwd: res.data.pwd,
            }));
          }
        })
        .catch(() => {});
    }
  }, [entry, getPasswordDetail]);

  if (!entry) return null;

  const handleSave = async () => {
    if (!entry?.UID) return;
    if (!label.trim()) {
      setError(t('common.errors.labelRequired'));
      return;
    }
    try {
      setIsSaving(true);
      setError('');
      const payload = {
        UID: entry.UID,
        label: label.trim(),
        comments: comments.trim(),
        favorite: isFavorite.toString(),
      };
      fields.forEach(({ key }) => {
        payload[key] = (formValues[key] ?? '').toString().trim();
      });

      const response = await updateEntry(payload);
      if (!response?.status) {
        const message = response?.error_message || t('editEntry.errors.updateFailed');
        setError(message);
        return;
      }
      onUpdated?.();
      onClose?.();
    } catch (err) {
      setError(err.message || t('editEntry.errors.updateGeneric'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="md" open={Boolean(entry)} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{t('editEntry.title')}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField fullWidth value={label} onChange={(event) => setLabel(event.target.value)} />
            <IconButton color={isFavorite ? 'warning' : 'default'} onClick={() => setIsFavorite((prev) => !prev)}>
              {isFavorite ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
          </Stack>

          <Divider />

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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving}>
          {isSaving ? t('common.actions.saving') : t('common.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEntryModal;

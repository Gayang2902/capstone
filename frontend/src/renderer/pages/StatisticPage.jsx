import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { useTranslation } from 'react-i18next';
import AppShell from '../components/AppShell.jsx';
import EntryCard from '../components/EntryCard.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import { useElectronAPI } from '../context/ElectronContext.jsx';
import { usePasswords } from '../context/PasswordContext.jsx';
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LayoutGroup, motion } from 'framer-motion';

const TAGS = ['website', 'server'];

const isFavoriteEntry = (value) => value === true || value === 'true';

const getOrderFallback = (entry) =>
  typeof entry?._orderRank === 'number' ? entry._orderRank : 0;

const getTimestamp = (entry) => {
  const time = new Date(entry?.created_at).getTime();
  if (Number.isFinite(time)) return time;
  return getOrderFallback(entry);
};

const compareModalEntries = (a, b) => {
  const aFav = isFavoriteEntry(a.favorite);
  const bFav = isFavoriteEntry(b.favorite);
  if (aFav !== bFav) return aFav ? -1 : 1;
  const tsDiff = getTimestamp(b) - getTimestamp(a);
  if (tsDiff !== 0) return tsDiff;
  const fallbackDiff = getOrderFallback(b) - getOrderFallback(a);
  if (fallbackDiff !== 0) return fallbackDiff;
  const aUID = String(a?.UID ?? '');
  const bUID = String(b?.UID ?? '');
  return bUID.localeCompare(aUID);
};

const sortGroupEntries = (items = []) => [...items].sort(compareModalEntries);
const StatisticPage = () => {
  const electronAPI = useElectronAPI();
  const { t, i18n } = useTranslation();
  const { entries, refreshEntries, deleteEntry } = usePasswords();
  const [strengthCounts, setStrengthCounts] = useState({ weak: 0, normal: 0, strong: 0 });
  const [tagCounts, setTagCounts] = useState({ strong: [], normal: [], weak: [] });
  const [vulnerableCounts, setVulnerableCounts] = useState({
    reused: 0,
    leaked: 0,
    old: 0,
  });
  const [issueModal, setIssueModal] = useState({
    open: false,
    type: null,
    groups: [],
    empty: false,
  });
  const [editEntry, setEditEntry] = useState(null);
  const doughnutRef = useRef(null);
  const barRef = useRef(null);
  const doughnutInstance = useRef(null);
  const barInstance = useRef(null);

  const entryMap = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      map.set(entry.UID, entry);
    });
    return map;
  }, [entries]);

  const totalPasswords = useMemo(
    () => strengthCounts.weak + strengthCounts.normal + strengthCounts.strong,
    [strengthCounts],
  );

  const summaryCards = useMemo(
    () => [
      { key: 'total', label: t('statistic.summary.total'), value: totalPasswords },
      { key: 'weak', label: t('statistic.summary.weak'), value: strengthCounts.weak },
      { key: 'normal', label: t('statistic.summary.normal'), value: strengthCounts.normal },
      { key: 'strong', label: t('statistic.summary.strong'), value: strengthCounts.strong },
    ],
    [strengthCounts, totalPasswords, t],
  );


  const formatLabel = useCallback(
    (tag) => {
      if (!tag) return t('types.unknown');
      return t(`types.${tag}`, { defaultValue: tag });
    },
    [t],
  );

  const extractList = useCallback((response) => {
    if (!response?.status) return null;
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && typeof payload === 'object') {
      const keyWithArray = Object.keys(payload).find((key) => Array.isArray(payload[key]));
      if (keyWithArray) return payload[keyWithArray];
    }
    return null;
  }, []);

  const normalizeGroups = useCallback((list) => {
    if (!list || !Array.isArray(list)) return [];
    const hasNested = list.some(Array.isArray);
    if (hasNested) {
      return list.map((item) => (Array.isArray(item) ? item : [item]));
    }
    if (list.length === 0) return [];
    return [list];
  }, []);

  const fetchStrengthCounts = useCallback(async () => {
    if (!electronAPI?.getVulnerablePasswordCount) return;
    try {
      const [weak, normal, strong] = await Promise.all([
        electronAPI.getVulnerablePasswordCount({ type: 'weak' }),
        electronAPI.getVulnerablePasswordCount({ type: 'normal' }),
        electronAPI.getVulnerablePasswordCount({ type: 'strong' }),
      ]);
      setStrengthCounts({
        weak: weak?.status ? weak.data.total : 0,
        normal: normal?.status ? normal.data.total : 0,
        strong: strong?.status ? strong.data.total : 0,
      });
    } catch (error) {
      console.error('Failed to fetch strength counts', error);
    }
  }, [electronAPI]);

  const fetchTagCounts = useCallback(async () => {
    if (!electronAPI?.getVulnerablePasswordCount) return;
    try {
      const results = await Promise.all(
        TAGS.map((tag) =>
          Promise.all([
            electronAPI.getVulnerablePasswordCount({ type: 'strong', tag }),
            electronAPI.getVulnerablePasswordCount({ type: 'normal', tag }),
            electronAPI.getVulnerablePasswordCount({ type: 'weak', tag }),
          ]),
        ),
      );

      const strong = [];
      const normal = [];
      const weak = [];
      results.forEach(([strongRes, normalRes, weakRes]) => {
        strong.push(strongRes?.status ? strongRes.data.total : 0);
        normal.push(normalRes?.status ? normalRes.data.total : 0);
        weak.push(weakRes?.status ? weakRes.data.total : 0);
      });
      setTagCounts({ strong, normal, weak });
    } catch (error) {
      console.error('Failed to fetch tag counts', error);
    }
  }, [electronAPI]);

  const fetchVulnerableCounts = useCallback(async () => {
    try {
      const [reused, leaked, old] = await Promise.all([
        electronAPI?.getReusedCount?.(),
        electronAPI?.getLeakedCount?.(),
        electronAPI?.getOldCount?.(),
      ]);
      setVulnerableCounts({
        reused: reused?.status ? reused.data.total : 0,
        leaked: leaked?.status ? leaked.data.total : 0,
        old: old?.status ? old.data.total : 0,
      });
    } catch (error) {
      console.error('Failed to fetch vulnerable counts', error);
    }
  }, [electronAPI]);

  const refreshStatsData = useCallback(async () => {
    await Promise.all([fetchStrengthCounts(), fetchTagCounts(), fetchVulnerableCounts()]);
  }, [fetchStrengthCounts, fetchTagCounts, fetchVulnerableCounts]);

  useEffect(() => {
    refreshStatsData();
  }, [refreshStatsData]);

  useEffect(() => {
    if (!doughnutRef.current) return undefined;
    const ctx = doughnutRef.current.getContext('2d');
    if (!ctx) return undefined;

    if (doughnutInstance.current) {
      doughnutInstance.current.destroy();
    }

    doughnutInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          t('statistic.strength.strong'),
          t('statistic.strength.normal'),
          t('statistic.strength.weak'),
        ],
        datasets: [
          {
            data: [strengthCounts.strong, strengthCounts.normal, strengthCounts.weak],
            spacing: 4,
            borderWidth: 0,
            backgroundColor: ['rgba(72,187,120,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
            cutout: '60%',
            hoverOffset: 16,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: false },
        },
      },
    });

    return () => {
      doughnutInstance.current?.destroy();
    };
  }, [strengthCounts, t, i18n.language]);

  useEffect(() => {
    if (!barRef.current) return undefined;
    const ctx = barRef.current.getContext('2d');
    if (!ctx) return undefined;

    if (barInstance.current) {
      barInstance.current.destroy();
    }

    barInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: TAGS.map((tag) => formatLabel(tag)),
        datasets: [
          {
            label: t('statistic.strength.weak'),
            data: tagCounts.weak,
            backgroundColor: 'rgba(239,68,68,0.8)',
            borderRadius: 6,
            categoryPercentage: 0.7,
            barPercentage: 0.7,
          },
          {
            label: t('statistic.strength.normal'),
            data: tagCounts.normal,
            backgroundColor: 'rgba(245,158,11,0.8)',
            borderRadius: 6,
            categoryPercentage: 0.7,
            barPercentage: 0.7,
          },
          {
            label: t('statistic.strength.strong'),
            data: tagCounts.strong,
            backgroundColor: 'rgba(72,187,120,0.8)',
            borderRadius: 6,
            categoryPercentage: 0.7,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
        plugins: {
          legend: { position: 'top' },
          title: { display: false },
        },
      },
    });

    return () => {
      barInstance.current?.destroy();
    };
  }, [tagCounts, formatLabel, t, i18n.language]);

  const renderTagTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <Paper elevation={4} sx={{ p: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        {payload.map((entry) => (
          <Typography
            key={entry.dataKey}
            variant="caption"
            sx={{ display: 'block', color: entry.color }}
          >
            {t(`statistic.strength.${entry.dataKey}`)}: {entry.value?.toLocaleString?.() ?? entry.value}
          </Typography>
        ))}
      </Paper>
    );
  };

  const renderStrengthTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    return (
      <Paper elevation={4} sx={{ p: 1 }}>
        <Typography variant="caption">
          {entry.name}: {entry.value?.toLocaleString?.() ?? entry.value}
        </Typography>
      </Paper>
    );
  };

  const fetchIssueEntries = useCallback(
    async (type) => {
      if (!type) return null;
      try {
        let response;
        if (type === 'reused') response = await electronAPI?.getReusedPasswords?.();
        if (type === 'leaked') response = await electronAPI?.getLeakedPasswords?.();
        if (type === 'old') response = await electronAPI?.getOldPasswords?.();

        if (!response?.status) {
          // eslint-disable-next-line no-alert
          alert(response?.error_message || t('statistic.alerts.unableToFetch'));
          return null;
        }

        const list = extractList(response);
        if (!list) {
          // eslint-disable-next-line no-alert
          alert(t('statistic.alerts.unableToFetch'));
          return null;
        }

        return normalizeGroups(list);
      } catch (error) {
        console.error('Failed to fetch detail list', error);
        // eslint-disable-next-line no-alert
        alert(t('statistic.alerts.unableToFetch'));
        return null;
      }
    },
    [electronAPI, extractList, normalizeGroups, t],
  );

  const handleShowList = useCallback(
    async (type) => {
      const groups = await fetchIssueEntries(type);
      if (groups === null) return;
      const sortedGroups = groups.map((group) => sortGroupEntries(group));
      setIssueModal({
        open: true,
        type,
        groups: sortedGroups,
        empty: sortedGroups.length === 0,
      });
      setEditEntry(null);
    },
    [fetchIssueEntries],
  );

  const handleCloseIssueModal = useCallback(() => {
    setIssueModal({
      open: false,
      type: null,
      groups: [],
      empty: false,
    });
    setEditEntry(null);
  }, []);

  const refreshIssueModal = useCallback(
    async (type) => {
      if (!type) return;
      const groups = await fetchIssueEntries(type);
      if (groups === null) {
        setIssueModal({
          open: false,
          type: null,
          groups: [],
          empty: false,
        });
        return;
      }
      const sortedGroups = groups.map((group) => sortGroupEntries(group));
      setIssueModal((prev) => ({
        open: prev.open,
        type,
        groups: sortedGroups,
        empty: sortedGroups.length === 0,
      }));
    },
    [fetchIssueEntries],
  );

  const handleEntryUpdated = useCallback(async () => {
    await refreshEntries?.();
    await refreshStatsData();
    if (issueModal.type) {
      await refreshIssueModal(issueModal.type);
    }
    setEditEntry(null);
  }, [refreshEntries, refreshStatsData, refreshIssueModal, issueModal.type]);

  const handleDeleteEntry = useCallback(
    async (entry) => {
      if (!entry?.UID) return;
      const confirmed = window.confirm(t('common.confirmDelete'));
      if (!confirmed) return;

      const res = await deleteEntry(entry.UID);
      if (!res?.status) {
        // eslint-disable-next-line no-alert
        alert(res?.error_message || t('common.errors.delete'));
        return;
      }

      await refreshEntries?.();
      await refreshStatsData();
      if (issueModal.type) {
        await refreshIssueModal(issueModal.type);
      }
    },
    [deleteEntry, t, refreshEntries, refreshStatsData, issueModal.type, refreshIssueModal],
  );

  const totalIssueEntries = useMemo(
    () => issueModal.groups.reduce((sum, group) => sum + group.length, 0),
    [issueModal.groups],
  );

  const issueTitle = useMemo(() => {
    if (!issueModal.type) return '';
    return t(`statistic.modal.title.${issueModal.type}`, {
      defaultValue: t(`statistic.cards.${issueModal.type}.title`, { defaultValue: issueModal.type }),
    });
  }, [issueModal.type, t]);

  const issueDescription = useMemo(() => {
    if (!issueModal.type) return '';
    return t(`statistic.cards.${issueModal.type}.description`, { defaultValue: '' });
  }, [issueModal.type, t]);

  const showGroupLabels = issueModal.type === 'reused';
  const issueCards = [
    { key: 'reused', color: 'primary', value: vulnerableCounts.reused },
    { key: 'leaked', color: 'error', value: vulnerableCounts.leaked },
    { key: 'old', color: 'warning', value: vulnerableCounts.old },
  ];

  useEffect(() => {
    if (!issueModal.open || entryMap.size === 0) return;
    setIssueModal((prev) => {
      const updatedGroups = prev.groups.map((group) => {
        const enriched = group.map((item) => {
          const latest = entryMap.get(item.UID);
          return latest ? { ...item, ...latest } : item;
        });
        return sortGroupEntries(enriched);
      });
      const changed = updatedGroups.some((group, groupIdx) =>
        group.some((entry, entryIdx) => entry.favorite !== prev.groups[groupIdx]?.[entryIdx]?.favorite),
      );
      if (!changed) return prev;
      return {
        ...prev,
        groups: updatedGroups,
      };
    });
  }, [entryMap, issueModal.open]);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 1.5,
            overflowX: { xs: 'auto', md: 'unset' },
            scrollbarWidth: 'thin',
          }}
        >
          {summaryCards.map(({ key, label, value }) => (
            <Paper
              key={key}
              sx={{
                p: 2,
                borderRadius: 3,
                textAlign: 'left',
                minHeight: 56,
                minWidth: { xs: 200, md: 'auto' },
                boxShadow: '0 8px 16px rgba(15,23,42,0.08)',
                backgroundColor:
                  key === 'total'
                    ? 'primary.50'
                    : key === 'weak'
                      ? 'error.50'
                      : key === 'normal'
                        ? 'warning.50'
                        : 'success.50',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {value.toLocaleString()}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Paper
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 4,
              minHeight: { xs: 260, md: 280 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {t('statistic.charts.typeDistribution')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('statistic.charts.typeHint', {
                defaultValue: '카테고리별 강도 분포를 확인하세요.',
              })}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 220 }}>
              <canvas ref={barRef} />
            </Box>
          </Paper>
          <Paper
            sx={{
              flex: 1,
              p: 3,
              borderRadius: 4,
              minHeight: { xs: 260, md: 280 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {t('statistic.charts.strengthDistribution')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('statistic.charts.strengthHint', {
                defaultValue: '전체 비밀번호 중 강도 비율입니다.',
              })}
            </Typography>
            <Box sx={{ flex: 1, minHeight: 220 }}>
              <canvas ref={doughnutRef} />
            </Box>
          </Paper>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {issueCards.map(({ key, color, value }) => (
            <Paper
              key={key}
              sx={{
                p: 2.5,
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                minHeight: 160,
                backgroundImage: (theme) =>
                  `linear-gradient(135deg, ${theme.palette[color].main}18, ${theme.palette[color].main}05)`,
              }}
            >
              <Box>
                <Typography variant="subtitle2" color={`${color}.main`} fontWeight={700}>
                  {t(`statistic.cards.${key}.title`)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t(`statistic.cards.${key}.description`)}
                </Typography>
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" fontWeight={700}>
                  {value.toLocaleString()}
                </Typography>
                <Button variant="contained" color={color} onClick={() => handleShowList(key)}>
                  {t('statistic.cards.action')}
                </Button>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Stack>

      <Dialog
        open={issueModal.open}
        onClose={handleCloseIssueModal}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">{issueTitle}</Typography>
            {issueDescription && (
              <Typography variant="body2" color="text.secondary">
                {issueDescription}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {t('statistic.modal.total', { count: totalIssueEntries.toLocaleString() })}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseIssueModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '70vh' }}>
          {issueModal.empty ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('statistic.modal.empty')}</Typography>
            </Box>
          ) : (
            <LayoutGroup id={`issue-groups-${issueModal.type || 'default'}`}>
              <Stack spacing={3} component={motion.div} layout>
                {issueModal.groups.map((group, groupIndex) => (
                  <Paper
                    key={`issue-group-${groupIndex}`}
                    component={motion.div}
                    layout
                    variant="outlined"
                    sx={{ p: 2 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 },
                    }}
                  >
                    {showGroupLabels && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary">
                          {t('statistic.modal.group', { index: groupIndex + 1 })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('statistic.modal.total', { count: group.length })}
                        </Typography>
                      </Stack>
                    )}
                    <Stack spacing={2} component={motion.div} layout>
                      {group.map((entry, entryIndex) => {
                        const entryKey = entry.UID ?? `${issueModal.type}-${groupIndex}-${entryIndex}`;
                        return (
                          <motion.div
                            key={entryKey}
                            layout
                            layoutId={`issue-entry-${entryKey}`}
                            transition={{
                              layout: { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 },
                            }}
                            style={{ width: '100%' }}
                          >
                            <EntryCard entry={entry} onEdit={setEditEntry} onDelete={handleDeleteEntry} />
                          </motion.div>
                        );
                      })}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </LayoutGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseIssueModal}>{t('common.actions.close')}</Button>
        </DialogActions>
      </Dialog>

      <EditEntryModal entry={editEntry} onClose={() => setEditEntry(null)} onUpdated={handleEntryUpdated} />
    </AppShell>
  );
};

export default StatisticPage;

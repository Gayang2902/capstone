import { Card, CardContent, Stack, Typography } from '@mui/material';

const STAT_COLORS = {
  default: { bg: 'background.paper', color: 'text.primary' },
  weak: { bg: 'error.light', color: 'error.dark' },
  normal: { bg: 'warning.light', color: 'warning.dark' },
  strong: { bg: 'success.light', color: 'success.dark' },
};

const StatCard = ({ label, value, variant = 'default' }) => {
  const palette = STAT_COLORS[variant] || STAT_COLORS.default;
  return (
    <Card sx={{ bgcolor: palette.bg }}>
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={palette.color}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StatCard;

import { createTheme } from '@mui/material/styles';

const getTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#6366F1',
      },
      secondary: {
        main: '#EE5DE2',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
    },
    typography: {
      fontFamily: ['Pretendard', 'Inter', 'Roboto', 'sans-serif'].join(','),
    },
    shape: {
      borderRadius: 14,
    },
  });

export default getTheme;

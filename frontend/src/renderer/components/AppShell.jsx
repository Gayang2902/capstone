import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  alpha,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  AppBar,
  Fab,
  Container,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import LocalSeeIcon from '@mui/icons-material/LocalSee';
import NoPhotographyIcon from '@mui/icons-material/NoPhotography';
import HelpIcon from '@mui/icons-material/Help';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import PasswordGeneratorModal from './PasswordGeneratorModal.jsx';
import LanguageIcon from '@mui/icons-material/Language';
import { useElectronAPI } from '../context/ElectronContext.jsx';
import useSecurityFeatures from '../hooks/useSecurityFeatures.js';
import SecurityContext from '../context/SecurityContext.jsx';
import getTheme from '../theme/createTheme.js';
import ChatbotModule from './chatbot/ChatbotModule.jsx';

const MotionButton = motion(Button);
const MotionBox = motion(Box);

const NAV_ITEMS = [
  { key: 'home', icon: 'fa-house', path: '/home', page: 'home' },
  { key: 'statistic', icon: 'fa-chart-line', path: '/statistic', page: 'statistic' },
  { key: 'group', icon: 'fa-users', path: '/group', page: 'group' },
  { key: 'setting', icon: 'fa-cog', path: '/setting', page: 'setting' },
];

const AnimatedThemeIcon = ({ isDarkMode }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={isDarkMode ? 'sun' : 'moon'}
      initial={{ scale: 0.4, rotate: isDarkMode ? -120 : 120, opacity: 0 }}
      animate={{ scale: 1.35, rotate: 0, opacity: 1 }}
      exit={{ scale: 0.6, rotate: isDarkMode ? 120 : -120, opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ display: 'inline-flex' }}
    >
      {isDarkMode ? (
        <WbSunnyRoundedIcon fontSize="small" color="warning" />
      ) : (
        <NightsStayRoundedIcon fontSize="small" color="inherit" />
      )}
    </motion.span>
  </AnimatePresence>
);

const AppShell = ({ headerExtras = null, children, showDefaultDarkToggle = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const electronAPI = useElectronAPI();
  const { resetTimer } = useSecurityFeatures();
  const { t, i18n } = useTranslation();
  const drawerWidth = 280;

  const [isGeneratorOpen, setGeneratorOpen] = useState(false);
  const [screenshotBlocked, setScreenshotBlocked] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isChatbotOpen, setChatbotOpen] = useState(false);
  const chatbotButtonControls = useAnimation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('ui.darkMode');
    if (stored != null) return stored === 'true';
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui.darkMode', String(isDarkMode));
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (screenshotBlocked) {
      electronAPI?.preventScreenshot?.();
    } else {
      electronAPI?.allowScreenshot?.();
    }
  }, [electronAPI, screenshotBlocked]);

  useEffect(() => {
    resetTimer();
  }, [location.pathname, resetTimer]);

  useEffect(() => {
    if (screenshotBlocked) {
      electronAPI?.preventScreenshot?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activePath = useMemo(() => {
    if (location.pathname === '/') return '/home';
    return location.pathname;
  }, [location.pathname]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleNavigate = (item) => {
    resetTimer();
    navigate(item.path);
    electronAPI?.navigate?.(item.page);
  };

  const handleGoStart = () => {
    resetTimer();
    navigate('/');
    electronAPI?.navigate?.('start');
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(next);
  };

  const resolvedHeaderExtras =
    typeof headerExtras === 'function' ? headerExtras({ toggleDarkMode, isDarkMode }) : headerExtras;

  const muiTheme = useMemo(() => getTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode]);
  const isMdDown = useMediaQuery(muiTheme.breakpoints.down('lg'));

  const navigationContent = (
    <Stack
      spacing={4}
      sx={{
        height: '100%',
        px: 3,
        py: 4,
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.12), transparent 45%), radial-gradient(circle at 100% 0%, rgba(236,72,153,0.12), transparent 40%)',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box component="i" className="fa-solid fa-key" sx={{ fontSize: 22, color: 'primary.main' }} />
        <Typography variant="subtitle1" fontWeight={700}>
          {t('common.appName')}
        </Typography>
      </Stack>

      <List sx={{ flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePath.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                handleNavigate(item);
                if (isMdDown) setDrawerOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 1,
                px: 2.5,
                py: 1.5,
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateX(4px)' },
                '&.Mui-selected': {
                  bgcolor: (th) => alpha(th.palette.primary.main, 0.15),
                  color: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box
                  component="i"
                  className={`fa-solid ${item.icon}`}
                  sx={{ fontSize: 18, color: isActive ? 'primary.main' : 'text.secondary' }}
                />
              </ListItemIcon>
              <ListItemText
                primary={t(`navigation.${item.key}`)}
                primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Stack>
  );

  return (
    <SecurityContext.Provider value={{ resetTimer }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
          }}
        >
          <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
            <Drawer
              variant={isMdDown ? 'temporary' : 'permanent'}
              open={isMdDown ? isDrawerOpen : true}
              onClose={() => setDrawerOpen(false)}
              ModalProps={{ keepMounted: true }}
              PaperProps={{
                sx: {
                  width: drawerWidth,
                  borderRight: 'none',
                  bgcolor: 'background.paper',
                  boxShadow: isMdDown ? 6 : 4,
                },
              }}
            >
              {navigationContent}
            </Drawer>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AppBar
              position="fixed"
              elevation={0}
              color="inherit"
              sx={{
                borderBottom: (th) => `1px solid ${th.palette.divider}`,
                bgcolor: (th) => alpha(th.palette.background.default, 0.85),
                backdropFilter: 'blur(12px)',
                ml: { lg: `${drawerWidth}px` },
                width: { lg: `calc(100% - ${drawerWidth}px)` },
              }}
            >
              <Toolbar sx={{ gap: 2 }}>
                {isMdDown && (
                  <IconButton edge="start" onClick={() => setDrawerOpen(true)}>
                    <MenuRoundedIcon />
                  </IconButton>
                )}
                <Tooltip title={t('shell.tooltips.openGenerator')}>
                  <Fab
                    color="primary"
                    size="medium"
                    onClick={() => setGeneratorOpen(true)}
                    sx={{
                      boxShadow: '0 10px 25px rgba(99,102,241,0.25)',
                    }}
                  >
                    <AddRoundedIcon />
                  </Fab>
                </Tooltip>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Tooltip
                    title={
                      screenshotBlocked
                        ? t('shell.tooltips.preventScreenshot')
                        : t('shell.tooltips.allowScreenshot')
                    }
                  >
                    <IconButton
                      size="large"
                      onClick={() => setScreenshotBlocked((prev) => !prev)}
                      sx={{
                        color: (th) => th.palette.primary.main,
                        '&:hover': {
                          color: (th) => th.palette.primary.dark,
                        },
                      }}
                    >
                      {screenshotBlocked ? (
                        <NoPhotographyIcon fontSize="medium" />
                      ) : (
                        <LocalSeeIcon fontSize="medium" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('shell.tooltips.goStart')}>
                    <IconButton
                      size="large"
                      color="primary"
                      onClick={handleGoStart}
                      sx={{
                        '&:hover': {
                          color: (th) => th.palette.primary.dark,
                        },
                      }}
                    >
                      <LoginRoundedIcon fontSize="medium" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('shell.tooltips.help')}>
                    <IconButton color="secondary" size="large">
                      <HelpIcon fontSize="medium" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('shell.tooltips.language')}>
                    <IconButton color="success" size="large" onClick={toggleLanguage}>
                      <LanguageIcon fontSize="medium" />
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {i18n.language?.toUpperCase() || 'KO'}
                      </Typography>
                    </IconButton>
                  </Tooltip>

                  {showDefaultDarkToggle && (
                    <Tooltip title={t('common.darkModeToggle')}>
                      <IconButton
                        onClick={toggleDarkMode}
                        sx={{ width: 44, height: 44, overflow: 'hidden', position: 'relative' }}
                      >
                        <AnimatedThemeIcon isDarkMode={isDarkMode} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {resolvedHeaderExtras && (
                    <>
                      <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
                      {resolvedHeaderExtras}
                    </>
                  )}
                </Stack>
              </Toolbar>
            </AppBar>

            <Toolbar />
            <Box
              component="main"
              sx={{
                flex: 1,
                py: { xs: 2, md: 4 },
                px: { xs: 2, md: 4 },
              }}
            >
              <Container maxWidth="xl">{children}</Container>
            </Box>
          </Box>

          <PasswordGeneratorModal open={isGeneratorOpen} onClose={() => setGeneratorOpen(false)} />
        </Box>

        <MotionButton
          variant="contained"
          onClick={async () => {
            await chatbotButtonControls.start({
              scale: [1, 1.18, 0.94, 1.04, 1],
              boxShadow: [
                '0px 20px 30px rgba(103,58,183,0.35)',
                '0px 45px 70px rgba(103,58,183,0.55)',
                '0px 10px 20px rgba(103,58,183,0.20)',
                '0px 30px 45px rgba(103,58,183,0.35)',
                '0px 20px 30px rgba(103,58,183,0.30)',
              ],
              transition: { duration: 0.55, ease: 'easeOut' },
            });
            setChatbotOpen(true);
          }}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 32 },
            bottom: { xs: 16, md: 40 },
            borderRadius: '50%',
            boxShadow: 6,
            zIndex: (th) => th.zIndex.tooltip + 1,
            width: 60,
            height: 60,
            minWidth: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          initial={{ scale: 1 }}
          animate={chatbotButtonControls}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Box component="i" className="fa-solid fa-key" sx={{ fontSize: 20, color: 'common.white' }} />
        </MotionButton>

        <AnimatePresence>
          {isChatbotOpen && (
            <>
              <MotionBox
                key="chatbot-overlay"
                onClick={() => setChatbotOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                sx={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: (th) => th.zIndex.modal,
                  backgroundColor: 'rgba(15, 23, 42, 0.35)',
                  backdropFilter: 'blur(2px)',
                }}
              />
              <MotionBox
                key="chatbot-widget"
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                sx={{
                  position: 'fixed',
                  right: { xs: 12, sm: 24, md: 32 },
                  bottom: { xs: 96, md: 120 },
                  width: { xs: 'calc(100% - 24px)', sm: 420, md: 480 },
                  zIndex: (th) => th.zIndex.modal + 1,
                  pointerEvents: 'auto',
                }}
              >
                <ChatbotModule />
              </MotionBox>
            </>
          )}
        </AnimatePresence>
      </ThemeProvider>
    </SecurityContext.Provider>
  );
};

export default AppShell;

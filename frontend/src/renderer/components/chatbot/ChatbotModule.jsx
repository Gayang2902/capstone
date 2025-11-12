import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  List,
  ListItem,
  Paper,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import { getLLMResponse } from '../../services/chatbot/LLMService.js';

const initialMessages = [{ role: 'bot', content: '안녕하세요! 패봇입니다. 무엇을 도와드릴까요?' }];

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#673AB7',
      light: '#9575CD',
      dark: '#512DA8',
    },
    secondary: {
      main: '#9575CD',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A237E',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: 'Noto Sans KR, Poppins, Roboto, sans-serif',
    h5: {
      fontFamily: 'Poppins, Noto Sans KR, sans-serif',
      fontWeight: 700,
      fontSize: '1.85rem',
      color: '#FFFFFF',
      letterSpacing: '0.04em',
    },
    body1: {
      fontSize: '0.95rem',
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      letterSpacing: '0.05em',
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '25px',
          boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
          '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '25px',
            backgroundColor: '#ffffff',
            '&.Mui-focused fieldset': { borderColor: '#673AB7' },
          },
          '& .MuiOutlinedInput-input': { padding: '12px 18px' },
        },
      },
    },
  },
});

const ChatContainer = styled(Box)(() => ({
  width: '100%',
  maxWidth: 560,
  height: 'min(78vh, 680px)',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 32,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.35)',
  boxShadow: '0 35px 65px rgba(15,23,42,0.4)',
  backdropFilter: 'blur(32px)',
}));

const MessagesListArea = styled(List)(() => ({
  flexGrow: 1,
  padding: 24,
  overflowY: 'auto',
  background: 'rgba(255,255,255,0.04)',
}));

const ChatBubble = styled(Paper)(({ role }) => ({
  padding: '12px 18px',
  maxWidth: '75%',
  borderRadius: '20px',
  borderTopLeftRadius: role === 'bot' ? '2px' : '20px',
  borderTopRightRadius: role === 'user' ? '2px' : '20px',
  wordWrap: 'break-word',
  fontSize: '0.95rem',
  margin: '6px 0',
  lineHeight: 1.4,
  border: '1px solid rgba(255,255,255,0.35)',
  background:
    role === 'user'
      ? 'linear-gradient(135deg, rgba(124,77,255,0.95), rgba(99,102,241,0.85))'
      : 'rgba(255,255,255,0.75)',
  color: role === 'user' ? '#fff' : '#0f172a',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  backdropFilter: 'blur(18px)',
  boxShadow: '0 20px 30px rgba(15,23,42,0.25)',
  transition: 'all 0.3s ease-in-out',
}));

const STORAGE_KEY = 'chatbot.pabot.session';

const loadPersistedMessages = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialMessages;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return initialMessages;
    return parsed;
  } catch {
    return initialMessages;
  }
};

const ChatbotModule = () => {
  const [messages, setMessages] = useState(() => loadPersistedMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const llmResponseText = await getLLMResponse(userMessage);
      const botMessage = { role: 'bot', content: llmResponseText };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('챗봇 응답 처리 오류:', error);
      const errorMessage = { role: 'bot', content: '응답을 가져오는 중 오류가 발생했습니다. (콘솔 확인)' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatContainer>
        <Box
          sx={{
            p: 2.5,
            borderBottom: '1px solid rgba(255,255,255,0.35)',
            background: 'linear-gradient(120deg, rgba(124,77,255,0.8), rgba(99,102,241,0.7))',
            color: '#ffffff',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.25,
            boxShadow: '0 15px 35px rgba(15,23,42,0.25)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <Box component="i" className="fa-solid fa-key" sx={{ fontSize: 26, color: '#ffffff' }} />
          <Typography variant="h5">Pabot</Typography>
        </Box>

        <MessagesListArea component="ul">
          {messages.map((msg, index) => (
            <ListItem
              key={`${msg.role}-${index}`}
              sx={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', padding: '4px 0' }}
            >
              <ChatBubble role={msg.role} elevation={1}>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    fontWeight: 'bold',
                    mb: 0.5,
                    color: (th) => (msg.role === 'bot' ? th.palette.secondary.main : 'rgba(255,255,255,0.7)'),
                  }}
                >
                  {msg.role === 'bot' ? '패봇' : '나'}
                </Typography>
                <Typography variant="body1">{msg.content}</Typography>
              </ChatBubble>
            </ListItem>
          ))}

          {isLoading && (
            <ListItem sx={{ justifyContent: 'flex-start', padding: '8px 0' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.25,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: '999px',
                  boxShadow: '0 12px 20px rgba(15,23,42,0.2)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <CircularProgress size={18} sx={{ mr: 1, color: '#7C4DFF' }} />
                <Typography variant="body2" color="text.primary" sx={{ opacity: 0.8 }}>
                  패봇이 생각 중입니다...
                </Typography>
              </Box>
            </ListItem>
          )}

          <div ref={messagesEndRef} />
        </MessagesListArea>

        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            display: 'flex',
            p: 2,
            borderTop: '1px solid #eee',
            backgroundColor: (th) => th.palette.background.paper,
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isLoading ? '응답 대기 중...' : '메시지를 입력하세요...'}
            disabled={isLoading}
            InputProps={{
              sx: {
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(18px)',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(99,102,241,0.9)' },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !input.trim()}
            sx={{
              borderRadius: '50%',
              minWidth: 54,
              width: 54,
              height: 54,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(124,77,255,1), rgba(99,102,241,0.95))',
              boxShadow: '0 18px 30px rgba(79,70,229,0.45)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(99,102,241,1), rgba(124,77,255,0.95))',
              },
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </ChatContainer>
    </ThemeProvider>
  );
};

export default ChatbotModule;

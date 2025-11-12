import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ElectronProvider } from './context/ElectronContext.jsx';
import { PasswordProvider } from './context/PasswordContext.jsx';
import NavigationSync from './navigation/NavigationSync.jsx';
import StartPage from './pages/StartPage.jsx';
import HomePage from './pages/HomePage.jsx';
import StatisticPage from './pages/StatisticPage.jsx';
import GroupPage from './pages/GroupPage.jsx';
import SettingPage from './pages/SettingPage.jsx';

const App = () => (
  <ElectronProvider>
    <PasswordProvider>
      <HashRouter>
        <NavigationSync />
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/statistic" element={<StatisticPage />} />
          <Route path="/group" element={<GroupPage />} />
          <Route path="/setting" element={<SettingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </PasswordProvider>
  </ElectronProvider>
);

export default App;

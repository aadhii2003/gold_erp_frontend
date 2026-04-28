import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { syncAllData } from './utils/syncManager';
import { useTheme } from './context/ThemeContext';

const App = () => {
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const { token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
       navigate('/');
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isOnline && token) {
      performSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, token]);

  const performSync = async () => {
    if (!token || syncing) return;
    try {
      setSyncing(true);
      await syncAllData();
      console.log('Global sync completed from App root');
    } catch (e) {
      console.error('Error during global sync', e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] transition-colors duration-300">
      <main className="flex-1 p-0">
        <Outlet />
      </main>
    </div>
  );
};

export default App;

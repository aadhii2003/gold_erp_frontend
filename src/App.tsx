import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { getPendingSales, markSalesSynced } from './db/indexedDB';
import axios from 'axios';
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
      syncSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isOnline && token) {
      syncSales();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, token]);

  const syncSales = async () => {
    if (!token || syncing) return;
    try {
      setSyncing(true);
      const pendingSales = await getPendingSales();
      if (pendingSales.length === 0) {
        setSyncing(false);
        return;
      }
      const response = await axios.post('http://127.0.0.1:8000/api/sales/sync/', { sales: pendingSales }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        const syncedIds = pendingSales.map(s => (s as any).id);
        await markSalesSynced(syncedIds);
        console.log('Synced', response.data.synced_count, 'sales');
      }
    } catch (e) {
      console.error('Error syncing sales', e);
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

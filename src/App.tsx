import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { getPendingSales, markSalesSynced } from './db/indexedDB';
import { Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { useTheme } from './context/ThemeContext';

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic routing logic
    if (!token) {
       navigate('/');
    }
  }, [token]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
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
        const syncedIds = pendingSales.map(s => s.id);
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
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      {user && (
        <header className="bg-[var(--bg-card)] border-b border-[var(--border-main)] p-4 flex justify-between items-center shadow-sm">
          <div className="font-bold text-xl tracking-tight">GOLD POS</div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-sidebar)] transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-zinc-600" />}
            </button>
            <div className="flex items-center text-sm font-medium">
              {isOnline ? (
                <span className="text-green-500 flex items-center"><Wifi className="w-4 h-4 mr-2" /> Online</span>
              ) : (
                <span className="text-red-500 flex items-center"><WifiOff className="w-4 h-4 mr-2" /> Offline</span>
              )}
            </div>
            {syncing && <span className="text-zinc-500 text-sm animate-pulse">Syncing...</span>}
            <div className="text-[var(--text-muted)] text-sm">
              {user.username} ({user.role})
            </div>
            {user.role === 'ADMIN' && (
              <button className="text-sm bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1 rounded" onClick={() => navigate('/admin')}>Admin</button>
            )}
            {user.role === 'STAFF' && (
              <button className="text-sm bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1 rounded" onClick={() => navigate('/pos')}>POS Billing</button>
            )}
            <button className="text-sm border border-red-500/50 text-red-400 px-3 py-1 rounded hover:bg-red-500/10 transition-colors" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }}>Logout</button>
          </div>
        </header>
      )}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default App;

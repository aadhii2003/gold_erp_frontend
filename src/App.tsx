import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { getPendingSales, markSalesSynced } from './db/indexedDB';
import { Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

const App = () => {
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
    <div className="min-h-screen flex flex-col">
      {user && (
        <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
          <div className="font-bold text-xl tracking-tight">GOLD POS</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm font-medium">
              {isOnline ? (
                <span className="text-green-500 flex items-center"><Wifi className="w-4 h-4 mr-2" /> Online</span>
              ) : (
                <span className="text-red-500 flex items-center"><WifiOff className="w-4 h-4 mr-2" /> Offline</span>
              )}
            </div>
            {syncing && <span className="text-zinc-500 text-sm animate-pulse">Syncing...</span>}
            <div className="text-zinc-400 text-sm">
              {user.username} ({user.role})
            </div>
            {user.role === 'ADMIN' && (
              <button className="text-sm bg-zinc-800 px-3 py-1 rounded" onClick={() => navigate('/admin')}>Admin</button>
            )}
            {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <button className="text-sm bg-zinc-800 px-3 py-1 rounded" onClick={() => navigate('/manager')}>Manager</button>
            )}
            {user.role === 'STAFF' && (
              <button className="text-sm bg-zinc-800 px-3 py-1 rounded" onClick={() => navigate('/pos')}>POS Billing</button>
            )}
            <button className="text-sm border border-red-500/50 text-red-400 px-3 py-1 rounded hover:bg-red-500/10" onClick={() => {
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

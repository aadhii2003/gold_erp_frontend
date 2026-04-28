import axios from 'axios';
import { getPendingSales, markSalesSynced, getPendingActions, deleteAction } from '../db/indexedDB';

export const syncAllData = async (token: string) => {
    if (!navigator.onLine) return;

    console.log('Starting Global Sync...');

    // 1. Sync Sales
    const pendingSales = await getPendingSales();
    if (pendingSales.length > 0) {
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/sales/sync/', { sales: pendingSales }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 201 || res.status === 200) {
                await markSalesSynced(pendingSales.map(s => s.id));
                console.log('Sales synced successfully');
            }
        } catch (e) {
            console.error('Sales sync failed', e);
        }
    }

    // 2. Sync General Actions (Outbox)
    const pendingActions = await getPendingActions();
    for (const action of pendingActions) {
        try {
            let endpoint = '';
            let method: 'post' | 'patch' | 'delete' = 'post';

            switch (action.type) {
                case 'CREATE_EXPENSE':
                    endpoint = 'http://127.0.0.1:8000/api/expenses/create/';
                    break;
                case 'CREATE_STAFF':
                    endpoint = 'http://127.0.0.1:8000/api/users/create/';
                    break;
                case 'TOGGLE_USER':
                    endpoint = `http://127.0.0.1:8000/api/users/${action.payload.id}/toggle/`;
                    method = 'patch';
                    break;
                case 'CREATE_BRANCH':
                    endpoint = 'http://127.0.0.1:8000/api/branches/';
                    break;
                default:
                    console.warn('Unknown action type in outbox', action.type);
                    continue;
            }

            if (endpoint) {
                const res = await axios({
                    url: endpoint,
                    method,
                    data: action.payload,
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status >= 200 && res.status < 300) {
                    await deleteAction(action.id);
                    console.log(`Action ${action.type} synced successfully`);
                }
            }
        } catch (e) {
            console.error(`Action ${action.type} sync failed`, e);
        }
    }
};

import apiClient from '../api/axiosConfig';
import { getPendingSales, markSalesSynced, getPendingActions, deleteAction } from '../db/indexedDB';

export const syncAllData = async () => {
    if (!navigator.onLine) return;

    console.log('Starting Global Sync...');

    // 1. Sync Sales
    const pendingSales = await getPendingSales();
    if (pendingSales.length > 0) {
        try {
            const res = await apiClient.post('/sales/sync/', { sales: pendingSales });
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
            let method: 'post' | 'patch' | 'delete' | 'put' = 'post';

            switch (action.type) {
                case 'CREATE_EXPENSE':
                    endpoint = '/expenses/create/';
                    break;
                case 'CREATE_STAFF':
                    endpoint = '/users/create/';
                    break;
                case 'TOGGLE_USER':
                    endpoint = `/users/${action.payload.id}/toggle/`;
                    method = 'patch';
                    break;
                case 'DELETE_USER':
                    endpoint = `/users/${action.payload.id}/delete/`;
                    method = 'delete';
                    break;
                case 'CREATE_BRANCH':
                    endpoint = '/branches/';
                    break;
                case 'DELETE_BRANCH':
                    endpoint = `/branches/${action.payload.id}/`;
                    method = 'delete';
                    break;
                case 'UPDATE_RATES':
                    endpoint = '/gold-rates/update/';
                    break;
                case 'CREATE_MATRIX':
                    endpoint = '/density-purity/';
                    break;
                case 'DELETE_MATRIX':
                    endpoint = `/density-purity/${action.payload.id}/`;
                    method = 'delete';
                    break;
                default:
                    console.warn('Unknown action type in outbox', action.type);
                    continue;
            }

            if (endpoint) {
                const res = await apiClient({
                    url: endpoint,
                    method,
                    data: action.payload
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

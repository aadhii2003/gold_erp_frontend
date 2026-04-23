import { openDB } from 'idb';

const DB_NAME = 'gold_erp_db';
const STORE_NAME = 'sales';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const saveSaleOffline = async (sale: any) => {
    const db = await initDB();
    await db.put(STORE_NAME, { ...sale, status: 'pending' });
};

export const getPendingSales = async () => {
    const db = await initDB();
    const allSales = await db.getAll(STORE_NAME);
    return allSales.filter(s => s.status === 'pending');
};

export const markSalesSynced = async (ids: string[]) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const id of ids) {
        const sale = await tx.store.get(id);
        if (sale) {
            sale.status = 'synced';
            await tx.store.put(sale);
        }
    }
    await tx.done;
};

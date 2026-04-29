import { openDB } from 'idb';

const DB_NAME = 'gold_erp_db';
const STORE_NAME = 'sales';
const USER_STORE = 'users';
const BRANCH_STORE = 'branches';
const EXPENSE_STORE = 'expenses';
const LOG_STORE = 'user_logs';
const CONST_STORE = 'constants';
const OUTBOX_STORE = 'outbox';

export const initDB = async () => {
    return openDB(DB_NAME, 5, { // Bump version
        upgrade(db, oldVersion, newVersion) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(USER_STORE)) {
                db.createObjectStore(USER_STORE, { keyPath: 'username' });
            }
            if (!db.objectStoreNames.contains(BRANCH_STORE)) {
                db.createObjectStore(BRANCH_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(EXPENSE_STORE)) {
                db.createObjectStore(EXPENSE_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(LOG_STORE)) {
                db.createObjectStore(LOG_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(CONST_STORE)) {
                db.createObjectStore(CONST_STORE, { keyPath: 'type' });
            }
            if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
                db.createObjectStore(OUTBOX_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('global_sales')) {
                db.createObjectStore('global_sales', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('matrix')) {
                db.createObjectStore('matrix', { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const seedAdmin = async () => {
    const db = await initDB();
    await db.put(USER_STORE, {
        username: 'admin@1',
        password: 'admin123', // In production, this would be a hash or token
        role: 'ADMIN',
        name: 'System Admin'
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

// --- Offline Helpers for Admin/Manager ---

export const saveBranchesOffline = async (branches: any[]) => {
    const db = await initDB();
    const tx = db.transaction(BRANCH_STORE, 'readwrite');
    await tx.store.clear();
    for (const b of branches) await tx.store.put(b);
    await tx.done;
};

export const getBranchesOffline = async () => {
    const db = await initDB();
    return db.getAll(BRANCH_STORE);
};

export const saveUsersOffline = async (users: any[]) => {
    const db = await initDB();
    const tx = db.transaction(USER_STORE, 'readwrite');
    // Keep the seeded admin if needed, but usually we sync all from server
    for (const u of users) await tx.store.put(u);
    await tx.done;
};

export const getUsersOffline = async () => {
    const db = await initDB();
    return db.getAll(USER_STORE);
};

export const saveExpensesOffline = async (expenses: any[]) => {
    const db = await initDB();
    const tx = db.transaction(EXPENSE_STORE, 'readwrite');
    await tx.store.clear();
    for (const e of expenses) await tx.store.put(e);
    await tx.done;
};

export const getExpensesOffline = async () => {
    const db = await initDB();
    return db.getAll(EXPENSE_STORE);
};

export const saveLogsOffline = async (logs: any[]) => {
    const db = await initDB();
    const tx = db.transaction(LOG_STORE, 'readwrite');
    await tx.store.clear();
    for (const l of logs) await tx.store.put(l);
    await tx.done;
};

export const getLogsOffline = async () => {
    const db = await initDB();
    return db.getAll(LOG_STORE);
};

export const saveGlobalSalesOffline = async (sales: any[]) => {
    const db = await initDB();
    const tx = db.transaction('global_sales', 'readwrite');
    await tx.store.clear();
    for (const s of sales) await tx.store.put(s);
    await tx.done;
};

export const getGlobalSalesOffline = async () => {
    const db = await initDB();
    return db.getAll('global_sales');
};

export const saveMatrixOffline = async (matrix: any[]) => {
    const db = await initDB();
    const tx = db.transaction('matrix', 'readwrite');
    await tx.store.clear();
    for (const m of matrix) await tx.store.put(m);
    await tx.done;
};

export const getMatrixOffline = async () => {
    const db = await initDB();
    return db.getAll('matrix');
};

export const saveConstantsOffline = async (type: string, data: any[]) => {
    const db = await initDB();
    await db.put(CONST_STORE, { type, data });
};

export const getConstantsOffline = async (type: string) => {
    const db = await initDB();
    const entry = await db.get(CONST_STORE, type);
    return entry ? entry.data : [];
};

export const queueAction = async (type: string, payload: any) => {
    const db = await initDB();
    await db.put(OUTBOX_STORE, { type, payload, timestamp: new Date().toISOString() });
};

export const getPendingActions = async () => {
    const db = await initDB();
    return db.getAll(OUTBOX_STORE);
};

export const deleteAction = async (id: number) => {
    const db = await initDB();
    await db.delete(OUTBOX_STORE, id);
};

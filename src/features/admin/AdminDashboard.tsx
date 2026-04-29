import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import * as XLSX from 'xlsx';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../app/store';
import { setRates } from '../../app/store';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard,
    ReceiptText,
    Wallet,
    Store,
    BarChart3,
    Plus,
    TrendingUp,
    ChevronRight,
    Search,
    Users,
    X,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    ArrowLeft,
    Sun,
    Moon,
    Bell,
    Command,
    LogOut,
    UserPlus,
    Activity,
    FileDown,
    Loader2,
    Info,
    RefreshCw,
    History as HistoryIcon,
    Eye
} from 'lucide-react';
import { 
    saveBranchesOffline, getBranchesOffline,
    saveUsersOffline, getUsersOffline,
    saveExpensesOffline, getExpensesOffline,
    saveLogsOffline, getLogsOffline,
    saveGlobalSalesOffline, getGlobalSalesOffline,
    saveMatrixOffline, getMatrixOffline,
    queueAction, getPendingActions
} from '../../db/indexedDB';
import { syncAllData } from '../../utils/syncManager';

const AdminDashboard = () => {
    const { token, user, rates } = useSelector((state: RootState) => state.auth);
    const { theme, toggleTheme } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingActions, setPendingActions] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState('dashboard');

    // Rates State
    const [goldPrice, setGoldPrice] = useState(rates?.gold_price || 2000);
    const [forexRate, setForexRate] = useState(rates?.forex_rate || 3800);

    // Branch state
    const [branchName, setBranchName] = useState('');
    const [xFactor, setXFactor] = useState(92.0);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchForManagers, setSelectedBranchForManagers] = useState<any>(null);

    // Sales & Users State
    const [allSales, setAllSales] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);

    // New Manager Form State
    const [newManagerUsername, setNewManagerUsername] = useState('');
    const [newManagerPassword, setNewManagerPassword] = useState('');
    const [newManagerEmail, setNewManagerEmail] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // UI & Filter State
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [salesFilterBranch, setSalesFilterBranch] = useState<string>('All Branches');

    // Expenses Global State
    const [expenses, setExpenses] = useState<any[]>([]);

    const [matrixList, setMatrixList] = useState<any[]>([]);
    const [newDensity, setNewDensity] = useState('');
    const [newPurity, setNewPurity] = useState('');

    // Admin Logs State
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [autoGoldPrice, setAutoGoldPrice] = useState<number | null>(null);
    const [showGlobalSyncNotify, setShowGlobalSyncNotify] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'MANAGER') {
            navigate('/manager');
        } else if (user.role !== 'ADMIN') {
            navigate('/pos');
        } else {
            fetchBranches();
            fetchGlobalSales();
            fetchUsers();
            fetchExpenses();
            fetchMatrix();
            fetchAdminLogs();
        }

        const handleStatusChange = () => {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) {
                syncAllData().then(() => {
                    fetchBranches();
                    fetchUsers();
                    fetchGlobalSales();
                    fetchAdminLogs();
                });
            }
        };

        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, [user, navigate]);

    const fetchAdminLogs = async () => {
        const pending = await getPendingActions();
        setPendingActions(pending);
        try {
            const res = await apiClient.get('/user-logs/');
            setAdminLogs(res.data);
            await saveLogsOffline(res.data);
        } catch (e) { 
            console.error(e); 
            const offlineLogs = await getLogsOffline();
            if (offlineLogs.length > 0) setAdminLogs(offlineLogs);
        }
    };

    const fetchLiveGoldPrice = async () => {
        try {
            // Simulated Live Gold Price Fetch
            const simulatedPrice = 2345.50 + (Math.random() * 10);
            setAutoGoldPrice(Number(simulatedPrice.toFixed(2)));
            setShowGlobalSyncNotify(true);
        } catch (e) { console.error(e); }
    };

    const fetchExpenses = async () => {
        try {
            const res = await apiClient.get('/expenses/');
            setExpenses(res.data);
            await saveExpensesOffline(res.data);
        } catch (e) { 
            console.error(e); 
            const offlineExpenses = await getExpensesOffline();
            if (offlineExpenses.length > 0) setExpenses(offlineExpenses);
        }
    };

    const fetchMatrix = async () => {
        try {
            const res = await apiClient.get('/density-purity/');
            setMatrixList(res.data);
            await saveMatrixOffline(res.data);
        } catch (e) { 
            console.error(e); 
            const offlineMatrix = await getMatrixOffline();
            if (offlineMatrix.length > 0) setMatrixList(offlineMatrix);
        }
    };

    const createMatrixEntry = async () => {
        if (!newDensity || !newPurity) return;
        if (!window.confirm('Register this reference entry?')) return;
        const payload = { density: newDensity, purity: newPurity };

        if (!navigator.onLine) {
            await queueAction('CREATE_MATRIX', payload);
            alert('Offline: Matrix entry queued.');
            setNewDensity('');
            setNewPurity('');
            return;
        }

        try {
            await apiClient.post('/density-purity/', payload);
            setNewDensity('');
            setNewPurity('');
            fetchMatrix();
            fetchAdminLogs();
        } catch (e) { alert('Failed to add matrix entry. May be duplicate.'); }
    };

    const deleteMatrixEntry = async (id: number) => {
        if (!window.confirm('Remove this reference entry?')) return;
        if (!navigator.onLine) {
            await queueAction('DELETE_MATRIX', { id });
            alert('Offline: Deletion queued.');
            return;
        }

        try {
            await apiClient.delete(`/density-purity/${id}/`);
            fetchMatrix();
            fetchAdminLogs();
        } catch (e) { alert('Failed to delete entry.'); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                const formatted = data.map((row: any) => ({
                    density: Number(row.Density || row.density),
                    purity: Number(row.Purity || row.purity)
                })).filter((row) => !isNaN(row.density) && !isNaN(row.purity));

                if (formatted.length === 0) {
                    setIsUploading(false);
                    return alert('No valid data found in the file.');
                }
                
                setUploadProgress({ current: 0, total: formatted.length });

                for (let i = 0; i < formatted.length; i++) {
                    await apiClient.post('/density-purity/', formatted[i]);
                    setUploadProgress({ current: i + 1, total: formatted.length });
                }

                alert(`Successfully uploaded ${formatted.length} entries!`);
                fetchMatrix();
            } catch(err) {
                alert('Error processing file. Ensure it is a valid Excel format.');
            } finally {
                setIsUploading(false);
                setUploadProgress({ current: 0, total: 0 });
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadDemoTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { Density: 10.5, Purity: 0 },
            { Density: 15.2, Purity: 75.5 },
            { Density: 19.3, Purity: 99.9 }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MatrixTemplate");
        XLSX.writeFile(wb, "Density_Purity_Template.xlsx");
    };

    const fetchBranches = async () => {
        try {
            const res = await apiClient.get('/branches/');
            setBranches(res.data);
            await saveBranchesOffline(res.data);
        } catch (e) { 
            console.error(e); 
            const offlineBranches = await getBranchesOffline();
            if (offlineBranches.length > 0) setBranches(offlineBranches);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/users/');
            setUsersList(res.data);
            await saveUsersOffline(res.data);
        } catch (e) { 
            console.error(e); 
            const offlineUsers = await getUsersOffline();
            if (offlineUsers.length > 0) setUsersList(offlineUsers);
        }
    };

    const fetchGlobalSales = async () => {
        try {
            const res = await apiClient.get('/sales/');
            setAllSales(res.data);
            await saveGlobalSalesOffline(res.data);
        } catch (e) { 
            console.error(e); 
            const offlineSales = await getGlobalSalesOffline();
            if (offlineSales.length > 0) setAllSales(offlineSales);
        }
    };

    const updateRates = async () => {
        if (!window.confirm('Synchronize these rates across the entire global network?')) return;
        const payload = {
            gold_price: autoGoldPrice || goldPrice,
            forex_rate: forexRate
        };

        if (!navigator.onLine) {
            await queueAction('UPDATE_RATES', payload);
            alert('Offline: Rates sync queued.');
            return;
        }

        try {
            await apiClient.post('/gold-rates/update/', payload);
            
            if (autoGoldPrice) setGoldPrice(autoGoldPrice);
            dispatch(setRates({ gold_price: autoGoldPrice || goldPrice, forex_rate: forexRate }));
            setShowGlobalSyncNotify(false);
            setAutoGoldPrice(null);
            fetchAdminLogs();
            alert('Market rates synchronized successfully.');
        } catch (e) { alert('Failed to update rates.'); }
    };

    const createBranch = async () => {
        if (!branchName) return;
        if (!window.confirm(`Deploy new entity: ${branchName}?`)) return;
        const payload = {
            name: branchName,
            x_factor: xFactor
        };

        if (!navigator.onLine) {
            await queueAction('CREATE_BRANCH', payload);
            alert('Offline: Branch creation queued.');
            setBranchName('');
            return;
        }

        try {
            await apiClient.post('/branches/create/', payload);
            setBranchName('');
            setXFactor(92.0);
            fetchBranches();
            fetchAdminLogs();
            alert('New branch established.');
        } catch (e: any) { 
            const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : 'Branch creation failed.';
            alert(`Error: ${errorMsg}`);
        }
    };

    const deleteBranch = async (id: number) => {
        if (!window.confirm('Are you sure you want to decommission this branch? All associated data will remain but the branch entity will be removed.')) return;
        if (!navigator.onLine) {
            await queueAction('DELETE_BRANCH', { id });
            alert('Offline: Decommissioning queued.');
            return;
        }

        try {
            await apiClient.delete(`/branches/${id}/`);
            fetchBranches();
            fetchAdminLogs();
            alert('Branch decommissioned.');
        } catch (e) { alert('Deletion failed.'); }
    };

    const createManager = async () => {
        if (!selectedBranchForManagers || !newManagerUsername) return;
        if (!window.confirm(`Authorize ${newManagerUsername} as a manager for ${selectedBranchForManagers.name}?`)) return;
        const payload = {
            username: newManagerUsername,
            password: newManagerPassword,
            email: newManagerEmail,
            role: 'MANAGER',
            branch: selectedBranchForManagers.id
        };

        if (!navigator.onLine) {
            await queueAction('CREATE_STAFF', payload); // Reusing CREATE_STAFF logic for Manager creation
            alert('Offline: Manager authorization queued.');
            setNewManagerUsername('');
            return;
        }

        try {
            await apiClient.post('/users/create/', payload);
            setNewManagerUsername('');
            setNewManagerPassword('');
            setNewManagerEmail('');
            fetchUsers();
            fetchAdminLogs();
            alert('Branch Manager provisioned.');
        } catch (e: any) { 
            const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : 'Provisioning failed.';
            alert(`Error: ${errorMsg}`);
        }
    };

    const toggleUserStatus = async (userId: number) => {
        if (!window.confirm('Update user authorization status?')) return;
        if (!navigator.onLine) {
            await queueAction('TOGGLE_USER', { id: userId });
            alert('Offline: Status update queued.');
            return;
        }

        try {
            await apiClient.patch(`/users/${userId}/toggle/`);
            fetchUsers();
            fetchAdminLogs();
            alert('User status updated successfully.');
        } catch (e) { alert('Status update failed.'); }
    };

    const removeUser = async (userId: number) => {
        if (!window.confirm('Permanently revoke access and remove this user from the system?')) return;
        if (!navigator.onLine) {
            await queueAction('DELETE_USER', { id: userId });
            alert('Offline: Removal queued.');
            return;
        }

        try {
            const res = await apiClient.delete(`/users/${userId}/delete/`);
            fetchUsers();
            fetchAdminLogs();
            alert(res.data.message || 'User permanently removed from the system.');
        } catch (e) { alert('Removal failed.'); }
    };

    const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-6 py-4 transition-all relative group ${activeTab === id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/0.2)] rounded-2xl scale-[1.02]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/0.5)] rounded-2xl'
                }`}
        >
            <Icon size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-[hsl(var(--background))] font-sans overflow-hidden transition-all duration-300">
            {/* Sidebar */}
            <aside className="w-72 border-r border-[hsl(var(--border))] flex flex-col bg-[hsl(var(--card))] z-10 no-print">
                <div className="h-24 flex items-center pt-4 px-6 border-b border-[hsl(var(--border))]">
                    <div className="flex-1 h-14 flex items-center gap-3 px-4 border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted)/0.5)] transition-all">
                        <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center shadow-lg shadow-[hsl(var(--primary)/0.2)]">
                            <ShieldCheck className="text-[hsl(var(--primary-foreground))]" size={18} />
                        </div>
                        <div>
                            <h1 className="font-black text-[10px] tracking-widest uppercase leading-none">Pure Admin</h1>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] opacity-60 mt-1 leading-none">System Controller</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
                    <NavItem id="dashboard" label="Performance" icon={LayoutDashboard} />
                    <NavItem id="sales" label="Sales Ledger" icon={ReceiptText} />
                    <NavItem id="branches" label="Entity Management" icon={Store} />
                    <NavItem id="expenses" label="Global Expenses" icon={Wallet} />
                    <NavItem id="matrix" label="Purity Matrix" icon={Activity} />
                    <NavItem id="logs" label="System Logs" icon={HistoryIcon} />
                </nav>

                <div className="p-8 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden border border-[hsl(var(--border))]">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt="avatar" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black uppercase truncate tracking-tight">{user?.username}</p>
                            <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Master Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                        }}
                        className="w-full flex items-center justify-between p-4 bg-[hsl(var(--muted))] rounded-2xl text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-all"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="h-24 pt-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] sticky top-0 z-40 px-8 flex items-center justify-between no-print">
                    <div className="flex items-center gap-6">
                        <div className="px-6 h-14 flex items-center border border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--muted)/0.3)]">
                            <h2 className="text-lg font-black uppercase tracking-tighter text-[hsl(var(--foreground))]">
                                Central Intelligence Control
                            </h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6 mr-6 border-r border-[hsl(var(--border))] pr-6">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Spot Gold</p>
                                <p className="text-sm font-black">${goldPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Forex Rate</p>
                                <p className="text-sm font-black">{forexRate.toLocaleString()} UGX</p>
                            </div>
                        </div>

                        <button onClick={toggleTheme} className="p-3 bg-[hsl(var(--muted))] rounded-2xl text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] transition-all">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>

                <div className="p-8 flex-1">
                    {/* Dashboard Tab Content */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    { label: 'Revenue (USD)', value: `$${allSales.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
                                    { label: 'Total Volume (g)', value: `${(allSales.reduce((acc, s) => acc + Number(s.actual_process_weight), 0)).toFixed(2)}`, icon: ReceiptText, color: 'text-blue-500' },
                                    { label: 'Network Nodes', value: branches.length, icon: Store, color: 'text-orange-500' },
                                    { label: 'System Status', value: 'OPTIMAL', icon: Activity, color: 'text-purple-500' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center justify-between mb-6">
                                            <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-[0.2em]">{stat.label}</p>
                                            <div className={`p-3 rounded-2xl bg-[hsl(var(--muted))] ${stat.color} group-hover:scale-110 transition-all`}>
                                                <stat.icon size={20} />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tighter">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 erp-section relative overflow-hidden">
                                    <div className="erp-section-header">
                                        <h3 className="erp-section-title flex items-center gap-2">
                                            <TrendingUp size={16} /> Market Rate Protocol
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">Real-time Node</span>
                                        </div>
                                    </div>
                                    <div className="erp-section-content space-y-8">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="erp-input-group">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="erp-label !mb-0">Spot Gold Price (USD/OZ)</label>
                                                        <button 
                                                            onClick={fetchLiveGoldPrice}
                                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[hsl(var(--primary))] hover:opacity-70 transition-all"
                                                        >
                                                            <RefreshCw size={10} className={showGlobalSyncNotify ? 'animate-spin' : ''} />
                                                            Auto-Fetch
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={autoGoldPrice || goldPrice}
                                                            onChange={e => {
                                                                setGoldPrice(Number(e.target.value));
                                                                setAutoGoldPrice(null);
                                                            }}
                                                            className={`erp-input text-2xl font-black ${autoGoldPrice ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : ''}`}
                                                        />
                                                        {autoGoldPrice && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                                <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-1 rounded-md animate-pulse">Live Price</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="erp-input-group">
                                                <label className="erp-label">Exchange Rate (UGX/USD)</label>
                                                <input
                                                    type="number"
                                                    value={forexRate}
                                                    onChange={e => setForexRate(Number(e.target.value))}
                                                    className="erp-input text-2xl font-black"
                                                />
                                            </div>
                                        </div>

                                        {showGlobalSyncNotify && (
                                            <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-[1.5rem] flex items-center justify-between gap-6 animate-in slide-in-from-top duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/20">
                                                        <ShieldAlert size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-0.5">Globalization Required</p>
                                                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-tight">Live gold price has changed to <span className="font-black text-orange-600">${autoGoldPrice}</span>. Synchronize with the global network to update all branch terminals.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={updateRates}
                                            className={`erp-button-primary w-full py-5 text-sm ${showGlobalSyncNotify ? 'bg-orange-500 shadow-orange-500/20 hover:bg-orange-600' : ''}`}
                                        >
                                            {showGlobalSyncNotify ? 'Authorize Global Synchronization' : 'Commit Manual protocol Changes'}
                                        </button>
                                    </div>
                                </div>

                                <div className="erp-section">
                                    <div className="erp-section-header">
                                        <h3 className="erp-section-title">Network Activity</h3>
                                    </div>
                                    <div className="erp-section-content !p-0">
                                        <table className="erp-table">
                                            <thead className="erp-table-header">
                                                <tr>
                                                    <th className="p-3">Branch</th>
                                                    <th className="p-3 text-right">X-Factor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {branches.slice(0, 5).map(branch => (
                                                    <tr key={branch.id} className="border-b border-[var(--border-main)] last:border-0">
                                                        <td className="p-3 text-[12px] font-bold">{branch.name}</td>
                                                        <td className="p-3 text-[12px] text-right font-mono">{branch.x_factor}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sales Tab Content */}
                    {activeTab === 'sales' && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <button
                                    onClick={() => setSalesFilterBranch('All Branches')}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${salesFilterBranch === 'All Branches' ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/0.1)]' : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))]'}`}
                                >
                                    Global Network View
                                </button>
                                {branches.map(branch => (
                                    <button
                                        key={branch.id}
                                        onClick={() => setSalesFilterBranch(branch.name)}
                                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${salesFilterBranch === branch.name ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/0.1)]' : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))] hover:text-[hsl(var(--foreground))]'}`}
                                    >
                                        {branch.name}
                                    </button>
                                ))}
                            </div>

                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title">Consolidated Sales Ledger</h3>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] font-bold px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded uppercase">Filter: {salesFilterBranch}</span>
                                    </div>
                                </div>
                                <div className="erp-section-content !p-0">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="px-10 py-6 text-left">Timestamp</th>
                                                <th className="px-10 py-6 text-left">Branch</th>
                                                <th className="px-10 py-6 text-left">Vendor</th>
                                                <th className="px-10 py-6 text-left">Purity</th>
                                                <th className="px-10 py-6 text-left">Weight (g)</th>
                                                <th className="px-10 py-6 text-left">Settlement (USD)</th>
                                                <th className="px-10 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                                {allSales
                                                .filter(s => salesFilterBranch === 'All Branches' || s.branch_name === salesFilterBranch)
                                                .map(sale => (
                                                    <tr key={sale.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                                                        <td className="px-10 py-6 font-mono text-[11px] text-[hsl(var(--muted-foreground))]">{new Date(sale.created_at).toLocaleString()}</td>
                                                        <td className="px-10 py-6 font-black uppercase text-[11px]">{sale.branch_name || 'Global'}</td>
                                                        <td className="px-10 py-6 text-[13px] font-black uppercase tracking-tight">{sale.vendor}</td>
                                                        <td className="px-10 py-6 font-mono text-[13px] text-emerald-600 font-black">{sale.actual_product_quality}%</td>
                                                        <td className="px-10 py-6 font-mono text-[13px] font-black">{sale.actual_process_weight}g</td>
                                                        <td className="px-10 py-6 font-black text-sm">${Number(sale.paid_amount).toLocaleString()}</td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button
                                                                onClick={() => setSelectedSale(sale)}
                                                                className="p-4 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] rounded-2xl transition-all"
                                                                title="View Bill"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Branches Tab Content */}
                    {activeTab === 'branches' && !selectedBranchForManagers && (
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-in fade-in duration-500 items-start">
                            {/* Left Side: Provision Form (Reduced Width) */}
                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title">Provision New Entity</h3>
                                </div>
                                <div className="erp-section-content space-y-8">
                                    <div className="erp-input-group">
                                        <label className="erp-label">Entity Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Branch Alpha"
                                            value={branchName}
                                            onChange={e => setBranchName(e.target.value)}
                                            className="erp-input"
                                        />
                                    </div>
                                    <div className="erp-input-group">
                                        <label className="erp-label">Efficiency Factor (%)</label>
                                        <input
                                            type="number"
                                            placeholder="92.0"
                                            value={xFactor}
                                            onChange={e => setXFactor(Number(e.target.value))}
                                            className="erp-input"
                                        />
                                    </div>
                                    <button
                                        onClick={createBranch}
                                        className="w-full py-4 bg-[var(--gold-gradient)] text-black font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs"
                                    >
                                        Register Branch
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Established Entities (2nd column) */}
                            <div className="xl:col-span-3 erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title">Established Entities</h3>
                                </div>
                                <div className="erp-section-content">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {branches.map(branch => (
                                            <div key={branch.id} className="p-6 bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] rounded-3xl flex flex-col gap-4 group transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Entity Name</p>
                                                        <p className="text-sm font-black uppercase">{branch.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Efficiency</p>
                                                        <p className="text-sm font-mono font-bold">{branch.x_factor}%</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <button
                                                        onClick={() => setSelectedBranchForManagers(branch)}
                                                        className="py-2.5 bg-[var(--gold-gradient)] text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:opacity-90 transition-all text-center"
                                                    >
                                                        Manage
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBranch(branch.id)}
                                                        className="py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all text-center"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {branches.length === 0 && (
                                            <div className="col-span-full py-10 text-center">
                                                <p className="text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest">No entities registered.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'branches' && selectedBranchForManagers && (
                        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                            <button 
                                onClick={() => setSelectedBranchForManagers(null)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all group"
                            >
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Return to Entity Registry
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Side: Details & Manager Form */}
                                <div className="space-y-8">
                                    <div className="erp-section border-l-4 border-black dark:border-white">
                                        <div className="erp-section-header">
                                            <h3 className="erp-section-title">Branch Intelligence</h3>
                                        </div>
                                        <div className="erp-section-content space-y-3">
                                            <div className="bg-[hsl(var(--muted)/0.5)] p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Entity Identity</p>
                                                <p className="text-lg font-black uppercase">{selectedBranchForManagers.name}</p>
                                                <div className="mt-2 flex items-center gap-4">
                                                    <div className="px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full border border-[hsl(var(--border))]">
                                                        <span className="text-[10px] font-black font-mono">{selectedBranchForManagers.x_factor}% X-FACTOR</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 space-y-3">
                                                <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest pl-1">Provision Branch Manager</p>
                                                <div className="space-y-3">
                                                    <div className="erp-input-group">
                                                        <label className="erp-label !mb-1">Username</label>
                                                        <input type="text" value={newManagerUsername} onChange={e => setNewManagerUsername(e.target.value)} className="erp-input py-2" placeholder="manager_id" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label !mb-1">Email</label>
                                                        <input type="email" value={newManagerEmail} onChange={e => setNewManagerEmail(e.target.value)} className="erp-input py-2" placeholder="m@golderp.com" />
                                                    </div>
                                                    <div className="erp-input-group">
                                                        <label className="erp-label !mb-1">Access Password</label>
                                                        <input type="password" value={newManagerPassword} onChange={e => setNewManagerPassword(e.target.value)} className="erp-input py-2" />
                                                    </div>
                                                    <button onClick={createManager} className="w-full py-3 mt-2 bg-[var(--gold-gradient)] text-black font-black rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                                                        Authorize Manager
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Personnel Lists */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Managers Section */}
                                    <div className="erp-section">
                                        <div className="erp-section-header">
                                            <h3 className="erp-section-title">Branch Managers</h3>
                                        </div>
                                        <div className="erp-section-content !p-0">
                                            <div className="grid gap-4 p-4">
                                                {usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').length === 0 ? (
                                                    <p className="text-center py-10 text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest">No managers assigned.</p>
                                                ) : (
                                                    usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').map(mgr => (
                                                        <div key={mgr.id} className="p-4 bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] rounded-2xl flex items-center justify-between group">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2.5 h-2.5 rounded-full ${mgr.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                                                <div>
                                                                    <p className="text-xs font-black uppercase mb-0.5">{mgr.username}</p>
                                                                    <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))]">{mgr.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => toggleUserStatus(mgr.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mgr.is_active ? 'bg-[var(--gold-gradient)] text-black shadow-sm' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'}`}>
                                                                    {mgr.is_active ? 'Suspend' : 'Restore'}
                                                                </button>
                                                                <button onClick={() => removeUser(mgr.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all">
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Staff Section */}
                                    <div className="erp-section">
                                        <div className="erp-section-header">
                                            <h3 className="erp-section-title">Branch Staff</h3>
                                        </div>
                                        <div className="erp-section-content !p-0">
                                            <div className="grid gap-4 p-4">
                                                {usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'STAFF').length === 0 ? (
                                                    <p className="text-center py-10 text-[10px] font-black uppercase text-[hsl(var(--muted-foreground))] tracking-widest">No staff records found.</p>
                                                ) : (
                                                    usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'STAFF').map(staff => (
                                                        <div key={staff.id} className="p-4 bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] rounded-2xl flex items-center justify-between group">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2.5 h-2.5 rounded-full ${staff.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                                                <div>
                                                                    <p className="text-xs font-black uppercase mb-0.5">{staff.username}</p>
                                                                    <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))]">{staff.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => toggleUserStatus(staff.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${staff.is_active ? 'bg-[var(--gold-gradient)] text-black shadow-sm' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'}`}>
                                                                    {staff.is_active ? 'Suspend' : 'Restore'}
                                                                </button>
                                                                <button onClick={() => removeUser(staff.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all">
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expenses Tab Content */}
                    {activeTab === 'expenses' && (
                        <div className="erp-section">
                            <div className="erp-section-header">
                                <h3 className="erp-section-title">Consolidated Expense Ledger</h3>
                            </div>
                            <div className="erp-section-content !p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="px-10 py-6">Posting Date</th>
                                                <th className="px-10 py-6">Origin Entity</th>
                                                <th className="px-10 py-6">Procurement Source</th>
                                                <th className="px-10 py-6">Volume (g)</th>
                                                <th className="px-10 py-6">Rate/g</th>
                                                <th className="px-10 py-6 text-right">Settlement (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {expenses.map(exp => (
                                                <tr key={exp.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                                    <td className="px-10 py-6 font-mono text-xs">{exp.date}</td>
                                                    <td className="px-10 py-6 font-black uppercase text-[11px]">{exp.branch_name || 'Global HQ'}</td>
                                                    <td className="px-10 py-6 text-sm font-bold">{exp.source_name}</td>
                                                    <td className="px-10 py-6 font-mono font-bold">{exp.grams} g</td>
                                                    <td className="px-10 py-6 font-mono text-[hsl(var(--muted-foreground))]">${exp.rate_per_gram}</td>
                                                    <td className="px-10 py-6 text-right font-black text-red-500">-${Number(exp.total).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            </div>
                        </div>
                    )}

                    {/* Matrix Tab Content */}
                    {activeTab === 'matrix' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
                            <div className="xl:col-span-2 erp-section h-fit max-h-[70vh] flex flex-col">
                                <div className="erp-section-header shrink-0">
                                    <h3 className="erp-section-title">Density & Purity Matrix</h3>
                                </div>
                                <div className="erp-section-content !p-0 overflow-y-auto">
                                    <table className="w-full text-left border-collapse relative">
                                        <thead className="sticky top-0 bg-[hsl(var(--card))] z-10 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="px-10 py-6">Density Level</th>
                                                <th className="px-10 py-6">Purity Equiv (%)</th>
                                                <th className="px-10 py-6 text-right">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {matrixList.map(item => (
                                                <tr key={item.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                                    <td className="px-10 py-6 font-mono font-black text-sm">{item.density}</td>
                                                    <td className="px-10 py-6 font-mono text-sm text-emerald-600 font-black">{item.purity}%</td>
                                                    <td className="px-10 py-6 text-right">
                                                        <button onClick={() => deleteMatrixEntry(item.id)} className="p-4 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="erp-section h-fit">
                                    <div className="erp-section-header">
                                        <h3 className="erp-section-title">Add Reference Value</h3>
                                    </div>
                                    <div className="erp-section-content">
                                        <div className="space-y-4">
                                            <div className="erp-input-group">
                                                <label className="erp-label">Calculated Density</label>
                                                <input type="number" step="0.01" value={newDensity} onChange={e => setNewDensity(e.target.value)} className="erp-input" placeholder="e.g. 17.25" />
                                            </div>
                                            <div className="erp-input-group">
                                                <label className="erp-label">Purity (%)</label>
                                                <input type="number" step="0.01" value={newPurity} onChange={e => setNewPurity(e.target.value)} className="erp-input" placeholder="e.g. 85.82" />
                                            </div>
                                            <button onClick={createMatrixEntry} className="erp-button-primary w-full">Commit Reference</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="erp-section h-fit">
                                    <div className="erp-section-header flex justify-between items-center">
                                        <h3 className="erp-section-title">Bulk Import Matrix</h3>
                                        <button 
                                            onClick={downloadDemoTemplate}
                                            title="Download Demo Template"
                                            className="p-2 hover:bg-[var(--bg-sidebar)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                                        >
                                            <FileDown size={18} />
                                        </button>
                                    </div>
                                    <div className="erp-section-content">
                                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={isUploading} className="erp-input mb-4 p-2 text-xs disabled:opacity-50" />
                                        
                                        {isUploading && (
                                            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                                                <Loader2 className="animate-spin text-emerald-500" size={20} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Uploading Matrix...</p>
                                                        <p className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{uploadProgress.current} / {uploadProgress.total}</p>
                                                    </div>
                                                    <div className="h-1 bg-[var(--border-main)] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-emerald-500 transition-all duration-300" 
                                                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 p-6 bg-[hsl(var(--muted))] rounded-2xl border border-[hsl(var(--border))] text-[10px] text-[hsl(var(--muted-foreground))]">
                                            <p className="font-black mb-2 uppercase tracking-widest text-[hsl(var(--foreground))]">Excel Format Guide:</p>
                                            <p className="leading-relaxed">Select an Excel file to immediately append all entries. Ensure the spreadsheet contains exactly two columns: <strong className="text-[hsl(var(--foreground))]">Density</strong> and <strong className="text-[hsl(var(--foreground))]">Purity</strong>.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs Tab Content */}
                    {activeTab === 'logs' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title flex items-center gap-2">
                                        <HistoryIcon size={16} /> System Audit Intelligence
                                    </h3>
                                    <button 
                                        onClick={fetchAdminLogs}
                                        className="p-2 hover:bg-[hsl(var(--muted))] rounded-xl transition-all text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="erp-section-content !p-0">
                                    <div className="max-h-[70vh] overflow-y-auto">
                                        <table className="erp-table">
                                            <thead className="erp-table-header sticky top-0 z-10 bg-[hsl(var(--card))]">
                                                <tr>
                                                    <th className="p-6">Timeline</th>
                                                    <th className="p-6">Administrator</th>
                                                    <th className="p-6">Protocol Action</th>
                                                    <th className="p-6">Audit Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[hsl(var(--border))]">
                                                {/* Pending Actions */}
                                                {pendingActions.map(action => (
                                                    <tr key={`pending-${action.id}`} className="bg-amber-500/5 border-b border-amber-200/20 group">
                                                        <td className="px-10 py-6 font-mono text-[11px] text-amber-600">
                                                            {new Date(action.timestamp).toLocaleString()}
                                                            <span className="block text-[8px] font-black uppercase mt-1">Pending Sync</span>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                                    <RefreshCw size={12} className="animate-spin" />
                                                                </div>
                                                                <p className="text-xs font-black uppercase tracking-tight">{user?.username}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-amber-500/20 text-amber-700 border border-amber-500/20">
                                                                {action.type.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-6 text-[12px] font-bold text-amber-700/70 italic">
                                                            Scheduled for global synchronization: {JSON.stringify(action.payload).substring(0, 50)}...
                                                        </td>
                                                    </tr>
                                                ))}

                                                {adminLogs.map(log => (
                                                    <tr key={log.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                                                        <td className="px-10 py-6 font-mono text-[11px] text-[hsl(var(--muted-foreground))]">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))]">
                                                                    <Command size={12} />
                                                                </div>
                                                                    <p className="text-xs font-black uppercase tracking-tight">{log.username}</p>
                                                                    <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">{log.role}</p>
                                                                </div>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                                                log.action.includes('DELETE') || log.action.includes('REVOKE') ? 'bg-red-500/10 text-red-500' :
                                                                log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-500' :
                                                                'bg-blue-500/10 text-blue-500'
                                                            }`}>
                                                                {log.action.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-6 text-[12px] font-bold text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                                                            {log.details}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {adminLogs.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-20 text-center">
                                                            <div className="flex flex-col items-center gap-4 text-[hsl(var(--muted-foreground))]">
                                                                <Info size={48} className="opacity-20" />
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No protocol records found.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sale Bill Overlay */}
                {selectedSale && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white print:backdrop-blur-none print:static">
                        <div id="receipt-modal-container" className="bg-white text-zinc-900 w-full max-w-[90rem] h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:h-auto print:overflow-visible border border-white/20">
                            {/* Modal Actions */}
                            <div className="p-8 bg-zinc-50 border-b flex justify-between items-center print:hidden">
                                <div>
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Document Generation Protocol</h3>
                                    <p className="text-sm font-black text-zinc-900">Review Transaction</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => window.print()}
                                        className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
                                    >
                                        <FileDown size={16} /> Print Bill
                                    </button>
                                    <button
                                        onClick={() => setSelectedSale(null)}
                                        className="p-4 text-zinc-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Printable Receipt Area */}
                            <div id="receipt-content" className="p-12 print:p-8 font-sans text-zinc-900 bg-white flex-1 overflow-y-auto print:overflow-visible print:h-auto">
                                <>
                                    {/* Top Header */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h2 className="text-2xl font-bold text-zinc-800">{selectedSale.vendor || 'Walking Customer'}</h2>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="flex gap-4 justify-end">
                                                <span className="font-bold">Date:</span>
                                                <span>{selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleDateString('en-GB') : '---'}</span>
                                            </div>
                                            <div className="flex gap-4 justify-end">
                                                <span className="font-bold">PO#:</span>
                                                <span className="font-mono">{selectedSale.bill_number || `PN${String(selectedSale.id || '').split('-')[0].toUpperCase()}`}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Stats Row */}
                                    <div className="grid grid-cols-3 gap-8 mb-8 text-[13px]">
                                        <div className="flex gap-4">
                                            <span className="font-bold">Mkt Price:</span>
                                            <span>{Number(selectedSale.market_price || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex gap-4 justify-center">
                                            <span className="font-bold">Additions:</span>
                                            <span>{Number(selectedSale.discount_addition || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex gap-4 justify-end">
                                            <span className="font-bold">Forex Rate:</span>
                                            <span>{Number(selectedSale.currency_rate || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Main Transaction Table */}
                                    <table className="w-full text-[13px] border-collapse mb-6">
                                        <thead>
                                            <tr className="border-b border-zinc-200">
                                                <th className="py-4 px-2 text-left font-bold">SI #</th>
                                                <th className="py-4 px-2 text-center font-bold">Qty Grams</th>
                                                <th className="py-4 px-2 text-center font-bold">Qty Tolas</th>
                                                <th className="py-4 px-2 text-center font-bold">Tola Rate</th>
                                                <th className="py-4 px-2 text-center font-bold">Purity %</th>
                                                <th className="py-4 px-2 text-center font-bold">Unit Price</th>
                                                <th className="py-4 px-2 text-center font-bold">Price Currency</th>
                                                <th className="py-4 px-2 text-right font-bold">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-50">
                                            <tr>
                                                <td className="py-4 px-2">RM</td>
                                                <td className="py-4 px-2 text-center">{Number(selectedSale.actual_process_weight || 0).toFixed(2)}</td>
                                                <td className="py-4 px-2 text-center">{Number(selectedSale.qty_tolas || 0).toFixed(4)}</td>
                                                <td className="py-4 px-2 text-center">{Number(selectedSale.tola_rate || 0).toFixed(2)}</td>
                                                <td className="py-4 px-2 text-center">{Number(selectedSale.actual_product_quality || 0).toFixed(4)}</td>
                                                <td className="py-4 px-2 text-center">{Number(selectedSale.unit_price || 0).toFixed(2)}</td>
                                                <td className="py-4 px-2 text-center">{selectedSale.market_price_currency || 'USD'}</td>
                                                <td className="py-4 px-2 text-right">{Number(selectedSale.subtotal || 0).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-y-2 border-zinc-900 font-bold">
                                                <td className="py-3 px-2">Total</td>
                                                <td className="py-3 px-2 text-center">{Number(selectedSale.actual_process_weight || 0).toFixed(2)}</td>
                                                <td className="py-3 px-2 text-center">{Number(selectedSale.qty_tolas || 0).toFixed(4)}</td>
                                                <td colSpan={4}></td>
                                                <td className="py-3 px-2 text-right">
                                                    <div className="flex justify-end gap-4">
                                                        <span>{selectedSale.market_price_currency || 'USD'} $:</span>
                                                        <span>{Number(selectedSale.subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    {/* Payment Summary */}
                                    <div className="flex justify-end mb-12">
                                        <div className="w-1/3 border-b-2 border-zinc-900 pb-2 space-y-1">
                                            <div className="flex justify-between items-center text-[13px]">
                                                <span className="font-bold">Payment:</span>
                                                <div className="flex gap-4">
                                                    <span>{selectedSale.market_price_currency || 'USD'} $:</span>
                                                    <span className="font-bold">{Number(selectedSale.subtotal || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            {Number(selectedSale.currency_rate || 0) > 0 && (
                                                <div className="flex justify-between items-center text-[13px]">
                                                    <span className="font-bold opacity-0">Payment:</span>
                                                    <div className="flex gap-4">
                                                        <span>{selectedSale.transaction_currency || 'UGX'}:</span>
                                                        <span className="font-bold">
                                                            {Math.round(Number(selectedSale.total_ugx || 0) / 1000) * 1000 ? (Math.round(Number(selectedSale.total_ugx || 0) / 1000) * 1000).toLocaleString() : Number(selectedSale.total_ugx || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>

                                <div className="mt-32 text-[10px] text-center text-zinc-300 uppercase tracking-[0.4em]">
                                    Official Digital Protocol • Gold ERP System
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;

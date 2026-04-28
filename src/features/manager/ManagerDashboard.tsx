import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { 
    LayoutDashboard, 
    Users, 
    ReceiptText, 
    LogOut,
    Plus,
    Monitor,
    ChevronRight,
    TrendingUp,
    Wallet,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    Command,
    Activity,
    UserPlus,
    History,
    X,
    FileDown,
    Eye
} from 'lucide-react';
import { 
    saveUsersOffline, getUsersOffline,
    saveExpensesOffline, getExpensesOffline,
    saveLogsOffline, getLogsOffline,
    queueAction
} from '../../db/indexedDB';
import { syncAllData } from '../../utils/syncManager';

const ManagerDashboard = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Auth & Basic State
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [sales, setSales] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    
    // Expense State
    const [expenses, setExpenses] = useState<any[]>([]);
    const [sourceName, setSourceName] = useState('');
    const [ratePerGram, setRatePerGram] = useState<number | ''>('');
    const [grams, setGrams] = useState<number | ''>('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSale, setSelectedSale] = useState<any>(null);

    useEffect(() => {
        if (!user || user.role === 'STAFF') {
            navigate('/pos');
        } else {
            fetchSales();
            fetchStaff();
            fetchExpenses();
        }

        const handleOnline = () => {
            if (token) syncAllData(token).then(() => {
                fetchSales();
                fetchStaff();
                fetchExpenses();
            });
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [user, navigate, token]);

    const fetchSales = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/sales/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSales(res.data);
        } catch(e) { console.error(e); }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/users/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaffList(res.data);
            await saveUsersOffline(res.data);
        } catch(e) { 
            console.error(e); 
            const offlineUsers = await getUsersOffline();
            if (offlineUsers.length > 0) setStaffList(offlineUsers);
        }
    };

    const fetchExpenses = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/expenses/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExpenses(res.data);
            await saveExpensesOffline(res.data);
        } catch(e) { 
            console.error(e); 
            const offlineExpenses = await getExpensesOffline();
            if (offlineExpenses.length > 0) setExpenses(offlineExpenses);
        }
    };

    const createStaff = async () => {
        if (!newUsername || !newPassword) return;
        const payload = { 
            username: newUsername, 
            email: newEmail,
            password: newPassword, 
            role: 'STAFF' 
        };

        if (!navigator.onLine) {
            await queueAction('CREATE_STAFF', payload);
            alert('Offline: Staff creation queued. It will sync when online.');
            setNewUsername('');
            setNewEmail('');
            setNewPassword('');
            return;
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/users/create/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Staff account created successfully.');
            setNewUsername('');
            setNewEmail('');
            setNewPassword('');
            fetchStaff();
        } catch(e) { alert('Account creation failed.'); }
    };

    const expenseTotal = (ratePerGram !== '' && grams !== '') ? Number(ratePerGram) * Number(grams) : 0;

    const createExpense = async () => {
        if (!sourceName || !ratePerGram || !grams) return;
        const payload = {
            source_name: sourceName,
            rate_per_gram: Number(ratePerGram),
            grams: Number(grams),
            total: expenseTotal,
            date: expenseDate,
            branch: (user as any)?.branch_id
        };

        if (!navigator.onLine) {
            await queueAction('CREATE_EXPENSE', payload);
            alert('Offline: Expense recorded locally. It will sync when online.');
            setSourceName('');
            setRatePerGram('');
            setGrams('');
            return;
        }

        try {
            await axios.post('http://127.0.0.1:8000/api/expenses/create/', payload, { headers: { Authorization: `Bearer ${token}` } });
            
            setSourceName('');
            setRatePerGram('');
            setGrams('');
            fetchExpenses();
            alert('Expense added successfully.');
        } catch (e) { alert('Failed to record expense.'); }
    };

    const toggleUserStatus = async (id: number) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/users/${id}/toggle/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStaff();
            alert('Status updated.');
        } catch (e) { alert('Status update failed.'); }
    };

    const deleteUser = async (id: number) => {
        if (!window.confirm('Permanently delete this staff account?')) return;
        try {
            const res = await axios.delete(`http://127.0.0.1:8000/api/users/${id}/delete/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStaff();
            alert(res.data.message || 'Staff permanently deleted.');
        } catch (e) { alert('Deletion failed.'); }
    };

    const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
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
                            <Monitor className="text-[hsl(var(--primary-foreground))]" size={18} />
                        </div>
                        <div>
                            <h1 className="font-black text-[10px] tracking-widest uppercase leading-none">Pure Branch</h1>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] opacity-60 mt-1 leading-none">Local Controller</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
                    <SidebarItem id="dashboard" label="Performance" icon={LayoutDashboard} />
                    <SidebarItem id="ledger" label="Sales Ledger" icon={ReceiptText} />
                    <SidebarItem id="terminals" label="Staff Mgmt" icon={Users} />
                    <SidebarItem id="expenses" label="Expenses" icon={Wallet} />
                </nav>

                <div className="p-8 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden border border-[hsl(var(--border))]">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt="avatar" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black uppercase truncate tracking-tight">{user?.username}</p>
                            <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Branch Manager</p>
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
                                Local Terminal Monitor
                            </h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-6 border-r border-[hsl(var(--border))] pr-6">
                            <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Active Branch</p>
                            <p className="text-sm font-black uppercase">{(user as any)?.branch_name || 'Assigned Branch'}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Synchronized</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-[var(--bg-sidebar)]/30">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { label: 'Branch Revenue', value: `$${sales.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
                                    { label: 'Transactions', value: sales.length, icon: ReceiptText, color: 'text-blue-500' },
                                    { label: 'Active Terminals', value: staffList.filter(s => s.role === 'STAFF').length, icon: Monitor, color: 'text-purple-500' },
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

                            <div className="erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title flex items-center gap-2">
                                        <Activity size={14} /> Recent Terminal Activity
                                    </h3>
                                </div>
                                <div className="erp-section-content !p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="p-6">Time</th>
                                                <th className="p-6">Authorized Staff</th>
                                                <th className="p-6">Product</th>
                                                <th className="p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {sales.slice(0, 8).map(s => (
                                                <tr key={s.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                                    <td className="p-6 font-mono text-xs text-[hsl(var(--muted-foreground))]">{new Date(s.created_at).toLocaleTimeString()}</td>
                                                    <td className="p-6 font-black uppercase text-[11px]">{s.staff_name}</td>
                                                    <td className="p-6 text-sm font-bold">{s.product_name}</td>
                                                    <td className="p-6 text-right">
                                                        <button 
                                                            onClick={() => setSelectedSale(s)} 
                                                            className="p-3 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] rounded-xl transition-all"
                                                            title="View Bill"
                                                        >
                                                            <Eye size={16} />
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

                    {/* Sales Logs Tab */}
                    {activeTab === 'ledger' && (
                        <div className="erp-section">
                            <div className="erp-section-header">
                                <h3 className="erp-section-title">Branch Sales History</h3>
                            </div>
                                <div className="erp-section-content !p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="p-6">Timestamp</th>
                                                <th className="p-6">Staff</th>
                                                <th className="p-6">Product Intelligence</th>
                                                <th className="p-6">Quality Matrix</th>
                                                <th className="p-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {sales.map(sale => (
                                                <tr key={sale.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                                    <td className="p-6 font-mono text-xs text-[hsl(var(--muted-foreground))]">{new Date(sale.created_at).toLocaleString()}</td>
                                                    <td className="p-6 font-black uppercase text-[11px]">{sale.staff_name}</td>
                                                    <td className="p-6">
                                                        <span className="font-bold text-sm">{sale.product_name}</span>
                                                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-black uppercase tracking-widest mt-1">{sale.vendor || 'Spot Market'}</p>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="font-black text-sm text-emerald-500">{sale.actual_product_quality}%</span>
                                                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold mt-1">{sale.actual_process_weight}g Processed</p>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <button 
                                                            onClick={() => setSelectedSale(sale)} 
                                                            className="p-3 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] rounded-xl transition-all"
                                                            title="View Bill"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                        </div>
                    )}

                    {/* Procurement Tab */}
                    {activeTab === 'expenses' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
                            <div className="xl:col-span-2 erp-section">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title">Procurement Ledger</h3>
                                </div>
                                <div className="erp-section-content !p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="p-6">Date</th>
                                                <th className="p-6">Source</th>
                                                <th className="p-6">Weight Data</th>
                                                <th className="p-6 text-right">Settlement</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {expenses.map(exp => (
                                                <tr key={exp.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                                                    <td className="p-6 font-mono text-xs">{exp.date}</td>
                                                    <td className="p-6 font-black uppercase text-[11px]">{exp.source_name}</td>
                                                    <td className="p-6 text-xs text-[hsl(var(--muted-foreground))] font-bold">{exp.grams}g @ <span className="text-[hsl(var(--foreground))]">${exp.rate_per_gram}/g</span></td>
                                                    <td className="p-6 text-right font-black text-red-500">-${Number(exp.total).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="erp-section h-fit">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title">Record Procurement</h3>
                                </div>
                                <div className="erp-section-content">
                                    <div className="space-y-4">
                                        <div className="erp-input-group">
                                            <label className="erp-label">Posting Date</label>
                                            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="erp-input" />
                                        </div>
                                        <div className="erp-input-group">
                                            <label className="erp-label">Source Identity</label>
                                            <input type="text" placeholder="e.g. Local Supplier" value={sourceName} onChange={e => setSourceName(e.target.value)} className="erp-input" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="erp-input-group">
                                                <label className="erp-label">Rate (USD/g)</label>
                                                <input type="number" placeholder="0.00" value={ratePerGram} onChange={e => setRatePerGram(e.target.value === '' ? '' : Number(e.target.value))} className="erp-input" />
                                            </div>
                                            <div className="erp-input-group">
                                                <label className="erp-label">Volume (g)</label>
                                                <input type="number" placeholder="0.00" value={grams} onChange={e => setGrams(e.target.value === '' ? '' : Number(e.target.value))} className="erp-input" />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-[hsl(var(--muted))] rounded-2xl border border-[hsl(var(--border))] text-center">
                                            <p className="text-[9px] text-[hsl(var(--muted-foreground))] font-black uppercase tracking-[0.2em] mb-2">Calculated Settlement</p>
                                            <p className="text-3xl font-black text-[hsl(var(--foreground))] tracking-tighter">${expenseTotal.toLocaleString()}</p>
                                        </div>
                                        <button onClick={createExpense} className="erp-button-primary w-full">Commit to Ledger</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Terminals Tab */}
                    {activeTab === 'terminals' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in duration-300">
                            <div className="xl:col-span-2 space-y-6">
                                <div className="erp-section">
                                    <div className="erp-section-header">
                                        <h3 className="erp-section-title">Authorized Terminals</h3>
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest">
                                            {staffList.filter(s => s.role === 'STAFF').length} Online
                                        </span>
                                    </div>
                                <div className="erp-section-content !p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[hsl(var(--muted))] text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="p-6">Terminal Node</th>
                                                <th className="p-6">Authorization</th>
                                                <th className="p-6 text-right">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[hsl(var(--border))]">
                                            {staffList.filter(s => s.role === 'STAFF').map(staff => (
                                                <tr key={staff.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] flex items-center justify-center text-xs font-black uppercase">
                                                                {staff.username.substring(0,2)}
                                                            </div>
                                                            <span className="font-black uppercase text-sm tracking-tight">{staff.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${staff.is_active ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                                                            {staff.is_active ? 'Authorized' : 'Suspended'}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <div className="flex items-center justify-end gap-4">
                                                            <button onClick={() => toggleUserStatus(staff.id)} className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))] hover:underline">
                                                                {staff.is_active ? 'Revoke Access' : 'Restore Access'}
                                                            </button>
                                                            <button onClick={() => deleteUser(staff.id)} className="p-3 bg-[hsl(var(--muted))] rounded-xl text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-all">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                </div>
                            </div>

                            <div className="erp-section h-fit">
                                <div className="erp-section-header">
                                    <h3 className="erp-section-title flex items-center gap-2"><UserPlus size={14} /> Provision Terminal</h3>
                                </div>
                                <div className="erp-section-content">
                                    <div className="space-y-4">
                                        <div className="erp-input-group">
                                            <label className="erp-label">Staff Identity</label>
                                            <input type="text" placeholder="e.g. staff_node_01" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="erp-input" />
                                        </div>
                                        <div className="erp-input-group">
                                            <label className="erp-label">Access Email</label>
                                            <input type="email" placeholder="staff@branch.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="erp-input" />
                                        </div>
                                            <div className="erp-input-group">
                                                <label className="erp-label">Access Primary Credentials</label>
                                                <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="erp-input" />
                                            </div>
                                            <button onClick={createStaff} className="erp-button-primary w-full">Deploy Terminal Node</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Sale Bill Overlay */}
                {selectedSale && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white print:backdrop-blur-none print:static">
                        <div className="bg-white text-zinc-900 w-full max-w-[90rem] h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:h-auto print:overflow-visible border border-white/20">
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
                                                <span className="font-mono">PN{selectedSale.id ? String(selectedSale.id).split('-')[0].toUpperCase() : '---'}</span>
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
        </div>
    );
};

export default ManagerDashboard;

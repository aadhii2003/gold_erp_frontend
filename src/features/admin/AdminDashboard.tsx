import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../app/store';
import { setRates } from '../../app/store';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ReceiptText,
    Wallet,
    Store,
    BarChart3,
    LogOut,
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
    Command
} from 'lucide-react';

const AdminDashboard = () => {
    const { token, user, rates } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

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

    // Expenses Global State
    const [expenses, setExpenses] = useState<any[]>([]);

    useEffect(() => {
        if (user?.role === 'MANAGER') {
            navigate('/manager');
        } else if (user?.role !== 'ADMIN') {
            navigate('/pos');
        } else {
            fetchBranches();
            fetchGlobalSales();
            fetchUsers();
            fetchExpenses();
        }
    }, [user, navigate]);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/expenses/', { headers: { Authorization: `Bearer ${token}` } });
            setExpenses(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchBranches = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/branches/', { headers: { Authorization: `Bearer ${token}` } });
            setBranches(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/users/', { headers: { Authorization: `Bearer ${token}` } });
            setUsersList(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchGlobalSales = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/sales/', { headers: { Authorization: `Bearer ${token}` } });
            setAllSales(res.data);
        } catch (e) { console.error(e); }
    };

    const updateRates = async () => {
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/rates/', { gold_price: goldPrice, forex_rate: forexRate }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setRates(res.data));
            alert('Market rates updated successfully.');
        } catch (e) { alert('Update failed.'); }
    };

    const createBranch = async () => {
        if (!branchName) return;
        try {
            await axios.post('http://127.0.0.1:8000/api/branches/create/', { name: branchName, x_factor: xFactor }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBranchName(''); setXFactor(92.0);
            fetchBranches();
            alert('New branch added.');
        } catch (e) { alert('Error adding branch.'); }
    };

    const createManager = async (branchId: number) => {
        if (!newManagerUsername || !newManagerPassword) return;
        try {
            await axios.post('http://127.0.0.1:8000/api/users/create/', {
                username: newManagerUsername,
                password: newManagerPassword,
                email: newManagerEmail,
                role: 'MANAGER',
                branch: branchId
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNewManagerUsername('');
            setNewManagerPassword('');
            setNewManagerEmail('');
            fetchUsers();
            alert('Manager assigned to branch.');
        } catch (e) { alert('Failed to assign manager.'); }
    };

    const toggleUserStatus = async (id: number) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/users/${id}/toggle/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (e) { alert('Access update failed.'); }
    };

    const deleteUser = async (id: number) => {
        if (!window.confirm('Permanently remove this manager? This action is irreversible.')) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/users/${id}/delete/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (e) { alert('Manager removal failed.'); }
    };

    const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-4 px-6 py-4.5 transition-all relative group ${activeTab === id
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
        >
            {activeTab === id && (
                <div className="absolute left-0 w-1.5 h-7 bg-[var(--accent-color)] rounded-r-full shadow-[0_0_20px_var(--accent-color)]" />
            )}
            <Icon size={22} className={`${activeTab === id ? 'scale-110 text-[var(--accent-color)]' : 'group-hover:scale-110'} transition-all duration-300`} />
            <span className="text-base font-bold tracking-tight">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden transition-all duration-500">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-secondary)] glass z-10">
                <div className="p-8 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--accent-color)] rounded-xl flex items-center justify-center shadow-lg">
                            <Command size={22} className="text-[var(--accent-text)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter leading-none">GOLD ERP</h1>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Admin Central</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem id="dashboard" label="Command Center" icon={LayoutDashboard} />
                    <SidebarItem id="branches" label="Global Nodes" icon={Store} />
                    <SidebarItem id="expenses" label="Procurement" icon={Wallet} />
                    <SidebarItem id="reports" label="Intelligence" icon={BarChart3} />
                </nav>

                <div className="p-4 mt-auto border-t border-[var(--border-color)] bg-[var(--bg-primary)]/30">
                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] group hover:border-[var(--text-secondary)] transition-all">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-[var(--border-color)] shadow-lg overflow-hidden flex-shrink-0">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt="avatar" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[var(--bg-secondary)] rounded-full shadow-emerald-500/20"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-[var(--text-primary)] truncate tracking-tight lowercase">@{user?.username}</p>
                            <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] mt-0.5">SUPER_USER</p>
                        </div>
                        <button 
                            onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                            className="p-2.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-xl transition-all"
                            title="Terminate Session"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header */}
                <header className="h-20 border-b border-[var(--border-color)] flex items-center justify-between px-10 bg-[var(--bg-primary)] glass sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">Admin</span>
                        <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                        <h2 className="text-sm font-bold text-[var(--text-primary)] capitalize">{activeTab}</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search Bar */}
                        <div className="hidden lg:flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2 rounded-xl group transition-all focus-within:ring-2 focus-within:ring-zinc-500/20">
                            <Search size={16} className="text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Command Search..."
                                className="bg-transparent border-none text-xs text-[var(--text-primary)] focus:outline-none w-48"
                            />
                            <span className="text-[10px] font-bold text-zinc-600 bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">⌘ K</span>
                        </div>

                        <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-6">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-zinc-500 hover:text-[var(--text-primary)] transition-all"
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>                             {/* Notifications */}
                            <button className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-zinc-500 hover:text-[var(--text-primary)] relative">
                                <Bell size={18} />
                                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-[var(--bg-secondary)]"></div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scroll Area */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Revenue', value: `$${allSales.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500' },
                                    { label: 'Total Volume', value: `${(allSales.reduce((acc, s) => acc + Number(s.grams), 0)).toFixed(2)}g`, icon: ReceiptText, color: 'text-blue-500' },
                                    { label: 'Active Nodes', value: branches.length, icon: Store, color: 'text-purple-500' },
                                    { label: 'System Status', value: 'Synced', icon: ShieldCheck, color: 'text-amber-500' },
                                ].map((stat, i) => (
                                    <div key={i} className="card p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-[var(--accent-color)]/5 transition-all group overflow-hidden relative">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--text-primary)] opacity-[0.02] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] ${stat.color} shadow-inner`}>
                                                <stat.icon size={22} className="group-hover:rotate-12 transition-transform" />
                                            </div>
                                            <div className="h-1 w-12 bg-gradient-to-r from-transparent to-[var(--border-color)] rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{stat.value}</p>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1.5">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="card p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <BarChart3 size={120} />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                                        <div className="w-2 h-6 bg-[var(--accent-color)] rounded-full"></div>
                                        Global Market Rates
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em]">Spot Gold Index</p>
                                            <div className="flex items-center border-b-2 border-[var(--border-color)] pb-4 focus-within:border-[var(--text-primary)] transition-colors">
                                                <span className="text-[var(--text-secondary)] mr-3 text-3xl font-light">$</span>
                                                <input
                                                    type="number"
                                                    value={goldPrice}
                                                    onChange={e => setGoldPrice(Number(e.target.value))}
                                                    className="bg-transparent text-5xl font-black text-[var(--text-primary)] w-full outline-none tracking-tighter"
                                                />
                                                <span className="text-[10px] text-emerald-500 font-bold ml-2">USD/OZ</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em]">Forex Base (UGX)</p>
                                            <div className="flex items-center border-b-2 border-[var(--border-color)] pb-4 focus-within:border-[var(--text-primary)] transition-colors">
                                                <input
                                                    type="number"
                                                    value={forexRate}
                                                    onChange={e => setForexRate(Number(e.target.value))}
                                                    className="bg-transparent text-5xl font-black text-[var(--text-primary)] w-full outline-none text-right tracking-tighter"
                                                />
                                                <span className="text-[var(--text-secondary)] ml-3 text-sm font-bold">UGX/USD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={updateRates}
                                        className="btn-primary w-full mt-12 py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-black/20"
                                    >
                                        Synchronize Global Nodes
                                    </button>
                                </div>

                                <div className="card p-8 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border-dashed border-2 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-zinc-500/10 flex items-center justify-center">
                                        <LayoutDashboard size={32} className="text-zinc-500 opacity-20" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Advanced Analytics</h4>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">Detailed periodic growth charts and audit logs will appear here in the next generation build.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 bg-zinc-800 rounded-full"></div>
                                        <div className="w-2 h-2 bg-zinc-800 rounded-full"></div>
                                        <div className="w-2 h-2 bg-zinc-800 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sales Tab */}
                    {activeTab === 'sales' && (
                        <div className="animate-in fade-in duration-500 space-y-6">
                            <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] glass">
                                <div className="relative max-w-sm w-full group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[var(--text-primary)] transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Trace Billing Identifier..."
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-12 pr-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Live Stream
                                    </div>
                                </div>
                            </div>

                            <div className="card p-0 overflow-hidden glass border-[var(--border-color)]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] bg-[var(--bg-secondary)]/50">
                                                <th className="p-6">Timeline</th>
                                                <th className="p-6">Branch Affinity</th>
                                                <th className="p-6">Product Specifications</th>
                                                <th className="p-6 text-right">Settlement</th>
                                                <th className="p-6"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {allSales.length > 0 ? (
                                                allSales.map(sale => (
                                                    <tr key={sale.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all group">
                                                        <td className="p-6 text-[var(--text-secondary)] font-medium">{new Date(sale.created_at).toLocaleDateString()}</td>
                                                        <td className="p-6">
                                                            <p className="text-[var(--text-primary)] font-bold">{sale.vendor || 'Authorized Merchant'}</p>
                                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">{sale.branch_name}</p>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[var(--text-primary)] font-medium">{sale.product_name}</span>
                                                                <span className="text-[10px] bg-[var(--bg-primary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">{sale.actual_product_quality}%</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 mt-1">{sale.actual_process_weight}g Net Weight</p>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <p className="text-lg font-black text-[var(--text-primary)] tracking-tight">${Number(sale.subtotal).toLocaleString()}</p>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <button className="p-2 hover:bg-[var(--bg-primary)] rounded-lg text-zinc-600 hover:text-[var(--text-primary)] transition-all">
                                                                <ChevronRight size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-20 text-center">
                                                        <div className="opacity-20 mb-4 flex justify-center">
                                                            <Search size={48} />
                                                        </div>
                                                        <p className="text-[var(--text-secondary)] font-medium">Global ledger is currently empty.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Branches Tab */}
                    {activeTab === 'branches' && (
                        <div className="animate-in fade-in duration-500">
                            {!selectedBranchForManagers ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {branches.map(b => (
                                                <div
                                                    key={b.id}
                                                    onClick={() => setSelectedBranchForManagers(b)}
                                                    className="card glass border-[var(--border-color)] hover:border-[var(--text-secondary)] transition-all cursor-pointer group relative overflow-hidden"
                                                >
                                                    <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                                        <Store size={120} />
                                                    </div>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl">
                                                            <Store className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" size={24} />
                                                        </div>
                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">Operational</span>
                                                    </div>
                                                    <h4 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{b.name}</h4>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-bold uppercase tracking-widest">Efficiency: {b.x_factor}%</p>
                                                    <div className="mt-8 flex items-center text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest group/link">
                                                        Manage Personnel <ChevronRight size={14} className="ml-1 group-hover/link:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="card h-fit sticky top-8 glass border-[var(--border-color)]">
                                        <div className="flex items-center gap-3 mb-8 text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">
                                            <Plus size={18} className="text-emerald-500" /> Initialize Node
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest ml-1">Affiliate Title</label>
                                                <input type="text" value={branchName} onChange={e => setBranchName(e.target.value)} className="input-field" placeholder="e.g. Dubai Central" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest ml-1">Variance Factor (%)</label>
                                                <input type="number" value={xFactor} onChange={e => setXFactor(Number(e.target.value))} className="input-field" />
                                            </div>
                                            <button onClick={createBranch} className="btn-primary w-full mt-4 py-4 font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-black/20">Deploy Node</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in slide-in-from-right-8 duration-500 space-y-8">
                                    {/* Personnel Management Header */}
                                    <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] glass">
                                        <div className="flex items-center gap-8">
                                            <button
                                                onClick={() => setSelectedBranchForManagers(null)}
                                                className="p-3 hover:bg-[var(--bg-primary)] rounded-xl text-zinc-500 hover:text-[var(--text-primary)] transition-all bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm"
                                            >
                                                <ArrowLeft size={22} />
                                            </button>
                                            <div>
                                                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{selectedBranchForManagers.name}</h3>
                                                <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] mt-1">Intelligence & Personnel Oversight</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden md:block">
                                                <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest leading-none">Efficiency Target</p>
                                                <p className="text-xl text-[var(--text-primary)] font-black tracking-tighter mt-1">{selectedBranchForManagers.x_factor}%</p>
                                            </div>
                                            <div className="h-10 w-[2px] bg-[var(--border-color)] rounded-full hidden md:block"></div>
                                            <div className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">
                                                Operational
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                                        {/* Existing Managers Section */}
                                        <div className="xl:col-span-2 space-y-8">
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] flex items-center gap-3">
                                                    <Users size={18} className="text-zinc-500" /> Operational High-Command
                                                </h4>
                                                <span className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-3 py-1.5 rounded-full border border-[var(--border-color)] font-black">
                                                    {usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').length} STATIONS
                                                </span>
                                            </div>
                                            <div className="space-y-4">
                                                {usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').length > 0 ? (
                                                    usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').map(m => (
                                                        <div key={m.id} className="card glass flex justify-between items-center p-6 group hover:border-[var(--text-secondary)] transition-all bg-[var(--bg-secondary)]/30">
                                                            <div className="flex items-center gap-6">
                                                                <div className={`p-4 rounded-2xl border ${m.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                                    <Users size={24} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-4">
                                                                        <p className="text-xl font-black text-[var(--text-primary)] tracking-tight">{m.username}</p>
                                                                        {m.is_active ?
                                                                            <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/20">Active</span> :
                                                                            <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter shadow-lg shadow-red-500/20">Offline</span>
                                                                        }
                                                                    </div>
                                                                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">{m.email || 'NODE_AUTH_LEGACY'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => toggleUserStatus(m.id)}
                                                                    className={`p-3 rounded-xl transition-all border shadow-sm ${m.is_active ? 'bg-[var(--bg-primary)] border-[var(--border-color)] text-emerald-500 hover:text-amber-500 hover:border-amber-500/40' : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-red-500 hover:text-emerald-500 hover:border-emerald-400/40'}`}
                                                                >
                                                                    {m.is_active ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteUser(m.id)}
                                                                    className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-red-500/40 text-[var(--text-secondary)] hover:text-red-500 rounded-xl transition-all shadow-sm"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="card p-20 text-center border-dashed border-2 border-[var(--border-color)] bg-transparent">
                                                        <Users size={48} className="mx-auto text-zinc-800 mb-6 opacity-20" />
                                                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-xs">No Node Commanders Assigned</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Assignment Portal Area */}
                                        <div className="space-y-8">
                                            <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] ml-2">Commander Provisioning</h4>
                                            <div className="card p-8 bg-[var(--bg-secondary)] border-[var(--border-color)] glass sticky top-32">
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-[var(--text-secondary)] uppercase font-black tracking-widest ml-1">Terminal ID</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. comms_alpha"
                                                            value={newManagerUsername}
                                                            onChange={e => setNewManagerUsername(e.target.value)}
                                                            className="input-field py-4 bg-[var(--bg-primary)]"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-[var(--text-secondary)] uppercase font-black tracking-widest ml-1">Secure Channel</label>
                                                        <input
                                                            type="email"
                                                            placeholder="secure@node.erp"
                                                            value={newManagerEmail}
                                                            onChange={e => setNewManagerEmail(e.target.value)}
                                                            className="input-field py-4 bg-[var(--bg-primary)]"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-[var(--text-secondary)] uppercase font-black tracking-widest ml-1">Access Passkey</label>
                                                        <input
                                                            type="password"
                                                            placeholder="••••••••••••"
                                                            value={newManagerPassword}
                                                            onChange={e => setNewManagerPassword(e.target.value)}
                                                            className="input-field py-4 bg-[var(--bg-primary)]"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => createManager(selectedBranchForManagers.id)}
                                                        className="btn-primary w-full py-5 mt-6 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-black/40"
                                                    >
                                                        Authorize Deployment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expenses Tab */}
                    {activeTab === 'expenses' && (
                        <div className="animate-in fade-in duration-500 space-y-10">
                            <div className="flex justify-between items-center bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] glass">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Procurement Intelligence</h2>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] mt-1">Cross-Node Expenditure Audit</p>
                                </div>
                                <button
                                    onClick={fetchExpenses}
                                    className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl text-zinc-500 hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all shadow-sm active:scale-95"
                                    title="Refresh Ledger"
                                >
                                    <TrendingUp size={24} className="rotate-90" />
                                </button>
                            </div>

                            <div className="card p-0 overflow-hidden glass border-[var(--border-color)]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] bg-[var(--bg-secondary)]/50">
                                                <th className="p-6">Registry Date</th>
                                                <th className="p-6">Origin Node</th>
                                                <th className="p-6">Liquidity Source</th>
                                                <th className="p-6">Quantum Specs</th>
                                                <th className="p-6 text-right">Settlement Vault</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {expenses.length > 0 ? (
                                                expenses.map(exp => (
                                                    <tr key={exp.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all group">
                                                        <td className="p-6 text-[var(--text-secondary)] font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                                                        <td className="p-6">
                                                            <span className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] font-bold text-xs">
                                                                {exp.branch_name}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-[var(--text-primary)] font-black uppercase tracking-tighter">{exp.source_name}</td>
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[var(--text-primary)] font-bold">{exp.grams}g</span>
                                                                <span className="text-zinc-500">@</span>
                                                                <span className="text-zinc-500 font-medium">${exp.rate_per_gram}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <p className="text-xl font-black text-[var(--text-primary)] tracking-tight">${Number(exp.total).toLocaleString()}</p>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-24 text-center">
                                                        <div className="opacity-10 mb-6 flex justify-center">
                                                            <ReceiptText size={64} />
                                                        </div>
                                                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-xs">No Procurement Records Detected</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <div className="flex flex-col items-center justify-center h-96 text-zinc-600 animate-in fade-in duration-300">
                            <BarChart3 size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Enterprise Reporting Suite</p>
                            <p className="text-sm mt-1">Advanced analytics modules coming soon</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;




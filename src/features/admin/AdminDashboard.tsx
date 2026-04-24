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
    ArrowLeft
} from 'lucide-react';

const AdminDashboard = () => {
    const { token, user, rates } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-colors ${activeTab === id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
        >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex h-[88vh] bg-zinc-950 font-sans overflow-hidden rounded-xl border border-zinc-900 shadow-2xl">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-900 flex flex-col bg-zinc-950">
                <div className="p-6 border-b border-zinc-900 mb-4">
                    <h1 className="text-xl font-bold text-white tracking-tight">Gold ERP Admin</h1>
                </div>

                <nav className="flex-1">
                    <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                    <SidebarItem id="sales" label="Sales & Billings" icon={ReceiptText} />
                    <SidebarItem id="expenses" label="Expenses" icon={Wallet} />
                    <SidebarItem id="branches" label="Branches" icon={Store} />
                    <SidebarItem id="reports" label="Reports" icon={BarChart3} />
                </nav>

                <div className="p-6 border-t border-zinc-900">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center gap-3 text-zinc-400 hover:text-red-400 transition-colors py-2 text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                {/* Header */}
                <div className="mb-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold text-white capitalize">
                            {activeTab.replace('-', ' ')}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">Management Overview</p>
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
                        <div className="text-right">
                            <p className="text-xs text-zinc-500">Administrator</p>
                            <p className="text-sm font-medium text-white">{user?.username}</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Revenue', value: `$${allSales.reduce((acc, s) => acc + Number(s.subtotal), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
                                { label: 'Transactions', value: allSales.length, icon: ReceiptText, color: 'text-blue-400' },
                                { label: 'Branches', value: branches.length, icon: Store, color: 'text-purple-400' },
                                { label: 'System Load', value: 'Optimal', icon: LayoutDashboard, color: 'text-amber-400' },
                            ].map((stat, i) => (
                                <div key={i} className="card p-6">
                                    <div className={`p-2 w-fit rounded-lg bg-zinc-800 mb-4 ${stat.color}`}>
                                        <stat.icon size={20} />
                                    </div>
                                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                                    <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="card max-w-4xl">
                            <h3 className="text-lg font-medium text-white mb-6">Global Market Rates</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm text-zinc-500 font-medium">Spot Gold (USD/oz)</label>
                                    <div className="flex items-center border-b border-zinc-800 pb-2">
                                        <span className="text-zinc-600 mr-2 text-xl">$</span>
                                        <input
                                            type="number"
                                            value={goldPrice}
                                            onChange={e => setGoldPrice(Number(e.target.value))}
                                            className="bg-transparent text-3xl font-semibold text-white w-full outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm text-zinc-500 font-medium">Forex Rate (UGX:USD)</label>
                                    <div className="flex items-center border-b border-zinc-800 pb-2">
                                        <input
                                            type="number"
                                            value={forexRate}
                                            onChange={e => setForexRate(Number(e.target.value))}
                                            className="bg-transparent text-3xl font-semibold text-white w-full outline-none text-right"
                                        />
                                        <span className="text-zinc-600 ml-2 text-sm font-medium">UGX</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={updateRates} className="btn-primary w-full mt-8">Apply Global Rates</button>
                        </div>
                    </div>
                )}

                {/* Sales Tab */}
                {activeTab === 'sales' && (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-6">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                                <input type="text" placeholder="Search billing records..." className="bg-zinc-900 border border-zinc-800 rounded-md pl-10 pr-4 py-2 text-sm text-white w-full outline-none focus:border-zinc-500" />
                            </div>
                        </div>

                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left font-sans">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-medium bg-zinc-900/50">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Vendor/Branch</th>
                                        <th className="p-4">Product Details</th>
                                        <th className="p-4 text-right">Total Amount</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {allSales.map(sale => (
                                        <tr key={sale.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors group">
                                            <td className="p-4 text-zinc-400">{new Date(sale.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <p className="text-white font-medium">{sale.vendor || 'Private'}</p>
                                                <p className="text-xs text-zinc-600">{sale.branch_name}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-zinc-300">{sale.product_name}</p>
                                                <p className="text-xs text-zinc-600">{sale.actual_process_weight}g | {sale.actual_product_quality}%</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <p className="text-white font-semibold">${Number(sale.subtotal).toLocaleString()}</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-zinc-600 hover:text-white"><ChevronRight size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Branches Tab */}
                {activeTab === 'branches' && (
                    <div className="animate-in fade-in duration-300">
                        {!selectedBranchForManagers ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {branches.map(b => (
                                            <div 
                                                key={b.id} 
                                                onClick={() => setSelectedBranchForManagers(b)}
                                                className="card border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <Store className="text-zinc-600 group-hover:text-white transition-colors" size={24} />
                                                    <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded font-medium">Online</span>
                                                </div>
                                                <h4 className="text-lg font-semibold text-white">{b.name}</h4>
                                                <p className="text-sm text-zinc-500 mt-1">X-Factor: {b.x_factor}%</p>
                                                <div className="mt-4 flex items-center text-xs text-zinc-400 font-medium group">
                                                    Manage Node Personnel <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card h-fit sticky top-0">
                                    <div className="flex items-center gap-2 mb-6 text-white font-medium">
                                        <Plus size={18} /> Add New Node
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-medium">Branch Name</label>
                                            <input type="text" value={branchName} onChange={e => setBranchName(e.target.value)} className="input-field" placeholder="Enter name" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500 font-medium">X-Factor (%)</label>
                                            <input type="number" value={xFactor} onChange={e => setXFactor(Number(e.target.value))} className="input-field" />
                                        </div>
                                        <button onClick={createBranch} className="btn-primary w-full mt-2">Create Branch</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                                {/* Personnel Management Header */}
                                <div className="flex items-center justify-between bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/60">
                                    <div className="flex items-center gap-6">
                                        <button 
                                            onClick={() => setSelectedBranchForManagers(null)}
                                            className="p-2.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-zinc-800"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{selectedBranchForManagers.name}</h3>
                                            <p className="text-sm text-zinc-500 mt-0.5">Personnel Management & Oversight</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Node Constants</p>
                                            <p className="text-sm text-white font-semibold">{selectedBranchForManagers.x_factor}% X-Factor</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-zinc-800 mx-2 hidden md:block"></div>
                                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                            Operational
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    {/* Existing Managers Section */}
                                    <div className="xl:col-span-2 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                <Users size={18} /> Node Management Hierarchy
                                            </h4>
                                            <span className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-1 rounded-full border border-zinc-800 font-bold">
                                                {usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').length} ASSIGNED
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').length > 0 ? (
                                                usersList.filter(u => u.branch === selectedBranchForManagers.id && u.role === 'MANAGER').map(m => (
                                                    <div key={m.id} className="card flex justify-between items-center p-5 group hover:border-zinc-700 transition-all bg-zinc-950/50 backdrop-blur-sm">
                                                        <div className="flex items-center gap-5">
                                                            <div className={`p-3 rounded-xl border ${m.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                                <Users size={22} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-lg font-semibold text-white">{m.username}</p>
                                                                    {m.is_active ? 
                                                                         <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm border border-emerald-500/40">Active</span> : 
                                                                         <span className="text-[9px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm border border-red-500/40">Suspended</span>
                                                                     }
                                                                </div>
                                                                <p className="text-sm text-zinc-500 mt-0.5">{m.email || 'System Default Auth'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => toggleUserStatus(m.id)}
                                                                className={`p-2.5 rounded-xl transition-all border ${m.is_active ? 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:text-amber-400 hover:border-amber-400/40' : 'bg-zinc-900 border-zinc-800 text-red-500 hover:text-emerald-400 hover:border-emerald-400/40'}`}
                                                                title={m.is_active ? "Suspend Manager Access" : "Grant Manager Access"}
                                                            >
                                                                {m.is_active ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteUser(m.id)}
                                                                className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-zinc-600 hover:text-red-500 rounded-xl transition-all"
                                                                title="Revoke Credentials"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="card p-12 text-center border-dashed border-zinc-800 bg-transparent">
                                                    <Users size={40} className="mx-auto text-zinc-800 mb-4" />
                                                    <p className="text-zinc-500 font-medium">No managers have been provisioned for this node.</p>
                                                    <p className="text-xs text-zinc-600 mt-1">Use the assignment portal to grant access.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assignment Portal Area */}
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <Plus size={18} /> Provisioning Portal
                                        </h4>
                                        <div className="card p-6 bg-zinc-900/20 border-zinc-800/60 sticky top-8">
                                            <p className="text-xs text-zinc-500 mb-6 font-medium leading-relaxed">
                                                Provisioning a new manager grants them administrative oversight over this branch's sales and gold procurement records.
                                            </p>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Unique Identifier</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. manager_dubai" 
                                                        value={newManagerUsername} 
                                                        onChange={e => setNewManagerUsername(e.target.value)} 
                                                        className="input-field py-3 bg-zinc-950" 
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Communication Link</label>
                                                    <input 
                                                        type="email" 
                                                        placeholder="manager@branch.com" 
                                                        value={newManagerEmail} 
                                                        onChange={e => setNewManagerEmail(e.target.value)} 
                                                        className="input-field py-3 bg-zinc-950" 
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Gateway Passkey</label>
                                                    <input 
                                                        type="password" 
                                                        placeholder="Secure Credentials" 
                                                        value={newManagerPassword} 
                                                        onChange={e => setNewManagerPassword(e.target.value)} 
                                                        className="input-field py-3 bg-zinc-950" 
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => createManager(selectedBranchForManagers.id)} 
                                                    className="btn-primary w-full py-4 mt-4 font-bold tracking-tight shadow-lg shadow-white/5 active:scale-[0.98] transition-transform"
                                                >
                                                    Finalize Node Assignment
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
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-6 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Global Procurement Ledger</h2>
                            <button onClick={fetchExpenses} className="text-zinc-500 hover:text-white transition-colors">
                                <Search size={18} />
                            </button>
                        </div>
                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs font-medium bg-zinc-900/50">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Branch</th>
                                        <th className="p-4">Source</th>
                                        <th className="p-4">Specifications</th>
                                        <th className="p-4 text-right">Total Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {expenses.length > 0 ? (
                                        expenses.map(exp => (
                                            <tr key={exp.id} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                                                <td className="p-4 text-zinc-400">{exp.date}</td>
                                                <td className="p-4 font-medium text-white">{exp.branch_name}</td>
                                                <td className="p-4 text-zinc-300 uppercase">{exp.source_name}</td>
                                                <td className="p-4 text-zinc-500">{exp.grams}g @ ${exp.rate_per_gram}</td>
                                                <td className="p-4 text-right font-bold text-white">${Number(exp.total).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-10 text-center text-zinc-600 italic">No procurement records found globally.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
            </main>
        </div>
    );
};

export default AdminDashboard;




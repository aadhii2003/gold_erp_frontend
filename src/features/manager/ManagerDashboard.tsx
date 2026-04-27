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
    FileDown
} from 'lucide-react';

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
    }, [user, navigate]);

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
        } catch(e) { console.error(e); }
    };

    const fetchExpenses = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/expenses/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExpenses(res.data);
        } catch(e) { console.error(e); }
    };

    const createStaff = async () => {
        if (!newUsername || !newPassword) return;
        try {
            await axios.post('http://127.0.0.1:8000/api/users/create/', { 
                username: newUsername, 
                email: newEmail,
                password: newPassword, 
                role: 'STAFF' 
            }, {
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
        try {
            await axios.post('http://127.0.0.1:8000/api/expenses/create/', {
                source_name: sourceName,
                rate_per_gram: Number(ratePerGram),
                grams: Number(grams),
                total: expenseTotal,
                date: expenseDate,
                branch: (user as any)?.branch_id
            }, { headers: { Authorization: `Bearer ${token}` } });
            
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
                                                        <button onClick={() => setSelectedSale(s)} className="text-[10px] font-black uppercase tracking-widest text-[var(--gold-primary)] hover:underline">View Bill</button>
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
                                                        <button onClick={() => setSelectedSale(sale)} className="text-[10px] font-black uppercase tracking-widest text-[var(--gold-primary)] hover:underline">View Bill</button>
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
                                                <input type="number" placeholder="0.00" value={ratePerGram} onChange={e => setRatePerGram(Number(e.target.value))} className="erp-input" />
                                            </div>
                                            <div className="erp-input-group">
                                                <label className="erp-label">Volume (g)</label>
                                                <input type="number" placeholder="0.00" value={grams} onChange={e => setGrams(Number(e.target.value))} className="erp-input" />
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[hsl(var(--card))] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-[hsl(var(--border))] overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted)/0.3)]">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Transaction Bill</h2>
                                <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mt-1">Ref: {selectedSale.id}</p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="p-3 bg-white dark:bg-zinc-900 border border-[hsl(var(--border))] rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            {/* Bill Header */}
                            <div className="grid grid-cols-2 gap-8 pb-8 border-b border-dashed border-[hsl(var(--border))]">
                                <div>
                                    <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2">Entity Origin</p>
                                    <p className="text-sm font-black uppercase">{selectedSale.branch_name || (user as any)?.branch_name}</p>
                                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] mt-1">{new Date(selectedSale.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2">Vendor / Source</p>
                                    <p className="text-sm font-black uppercase">{selectedSale.vendor}</p>
                                    <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] mt-1">Method: {selectedSale.purchase_method}</p>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] border-l-4 border-[var(--gold-primary)] pl-3">Financial Settlement</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-[hsl(var(--muted)/0.3)] p-6 rounded-3xl border border-[hsl(var(--border))]">
                                        <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Market Rate</p>
                                        <p className="text-lg font-black">${Number(selectedSale.market_price).toLocaleString()}<span className="text-[10px] ml-1">/g</span></p>
                                    </div>
                                    <div className="bg-[hsl(var(--muted)/0.3)] p-6 rounded-3xl border border-[hsl(var(--border))]">
                                        <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">X-Factor</p>
                                        <p className="text-lg font-black">{selectedSale.x_factor}%</p>
                                    </div>
                                    <div className="bg-[hsl(var(--muted)/0.3)] p-6 rounded-3xl border border-[hsl(var(--border))]">
                                        <p className="text-[9px] font-black text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Forex Rate</p>
                                        <p className="text-lg font-black">{Number(selectedSale.currency_rate).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] border-l-4 border-[var(--gold-primary)] pl-3">Product Specifications</h4>
                                <div className="erp-section !p-0 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                                            <tr>
                                                <th className="p-4 text-[9px] font-black uppercase tracking-widest">Description</th>
                                                <th className="p-4 text-[9px] font-black uppercase tracking-widest">Weight</th>
                                                <th className="p-4 text-[9px] font-black uppercase tracking-widest">Purity</th>
                                                <th className="p-4 text-right text-[9px] font-black uppercase tracking-widest">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-[hsl(var(--border))] last:border-0">
                                                <td className="p-4">
                                                    <p className="text-sm font-black uppercase">{selectedSale.product_name}</p>
                                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{selectedSale.description || 'Standard Gold Settlement'}</p>
                                                </td>
                                                <td className="p-4 font-mono text-sm font-bold">{selectedSale.actual_process_weight}g</td>
                                                <td className="p-4 font-mono text-sm font-bold text-emerald-600">{selectedSale.actual_product_quality}%</td>
                                                <td className="p-4 text-right font-black text-sm">${Number(selectedSale.paid_amount).toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Grand Totals */}
                            <div className="bg-black text-white p-8 rounded-[2rem] flex justify-between items-center shadow-xl">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Local Settlement</p>
                                    <p className="text-2xl font-black">{Number(selectedSale.total_ugx).toLocaleString()} <span className="text-sm opacity-60">UGX</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">USD Equiv</p>
                                    <p className="text-2xl font-black text-[var(--gold-primary)]">${Number(selectedSale.paid_amount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-[hsl(var(--muted)/0.3)] border-t border-[hsl(var(--border))] flex gap-4 no-print">
                            <button onClick={() => window.print()} className="flex-1 py-4 bg-white dark:bg-zinc-900 border border-[hsl(var(--border))] text-black dark:text-white font-black rounded-2xl hover:bg-[hsl(var(--muted))] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                <X size={16} className="rotate-45" /> Export Receipt
                            </button>
                            <button onClick={() => setSelectedSale(null)} className="flex-1 py-4 bg-black text-white font-black rounded-2xl hover:bg-zinc-800 transition-all uppercase tracking-widest text-xs">
                                Close Terminal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
